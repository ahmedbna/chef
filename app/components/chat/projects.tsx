import { memo, useCallback, useState } from 'react';
import { toast } from 'sonner';
import { ConfirmationDialog } from '@ui/ConfirmationDialog';
import { type ChatHistoryItem } from '~/types/ChatHistoryItem';
import { logger } from 'chef-agent/utils/logger';
import { Menu as MenuComponent, MenuItem as MenuItemComponent } from '@ui/Menu';
import { useSearchFilter } from '~/lib/hooks/useSearchFilter';
import { classNames } from '~/utils/classNames';
import { useConvex, useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import { getConvexAuthToken, useConvexSessionIdOrNullOrLoading } from '~/lib/stores/sessionId';
import { getKnownInitialId } from '~/lib/stores/chatId';
import { Button } from '@ui/Button';
import { TextInput } from '@ui/TextInput';
import { Checkbox } from '@ui/Checkbox';
import { PlusIcon } from '@radix-ui/react-icons';
import { binDates } from '../sidebar/date-binning';
import { HistoryItem } from '../sidebar/HistoryItem';
import { profileStore, setProfile } from '~/lib/stores/profile';
import { useStore } from '@nanostores/react';
import { PersonIcon, GearIcon, ExitIcon } from '@radix-ui/react-icons';
import { FeedbackButton } from '../header/FeedbackButton';
import { DiscordButton } from '../header/DiscordButton';
import { useAuth } from '@workos-inc/authkit-react';
import { SESSION_ID_KEY } from '~/components/chat/ChefAuthWrapper';

type ModalContent = { type: 'delete'; item: ChatHistoryItem } | null;

export const Projects = memo(() => {
  const sessionId = useConvexSessionIdOrNullOrLoading();
  const convex = useConvex();
  const profile = useStore(profileStore);
  const { signOut } = useAuth();

  const list = useQuery(api.messages.getAll, sessionId ? { sessionId } : 'skip') ?? [];
  const [dialogContent, setDialogContent] = useState<ModalContent>(null);
  const [shouldDeleteConvexProject, setShouldDeleteConvexProject] = useState(false);
  const convexProjectInfo = useQuery(
    api.convexProjects.loadConnectedConvexProjectCredentials,
    dialogContent?.type === 'delete' && sessionId
      ? {
          sessionId,
          chatId: dialogContent.item.initialId,
        }
      : 'skip',
  );

  const { filteredItems: filteredList, handleSearchChange } = useSearchFilter({
    items: list,
    searchFields: ['description'],
  });

  const deleteItem = useCallback(
    (item: ChatHistoryItem) => {
      const accessToken = getConvexAuthToken(convex);
      if (!sessionId || !accessToken) {
        return;
      }
      convex
        .action(api.messages.remove, {
          id: item.id,
          sessionId,
          teamSlug: convexProjectInfo?.teamSlug,
          projectSlug: convexProjectInfo?.projectSlug,
          shouldDeleteConvexProject: shouldDeleteConvexProject && convexProjectInfo?.kind === 'connected',
          accessToken,
        })
        .then((result) => {
          if (result && result.kind === 'error') {
            toast.error(result.error);
          }
          if (getKnownInitialId() === item.initialId) {
            // hard page navigation to clear the stores
            window.location.pathname = '/';
          }
        })
        .catch((error) => {
          toast.error('Failed to delete conversation');
          logger.error(error);
        });
    },
    [
      convex,
      sessionId,
      convexProjectInfo?.teamSlug,
      convexProjectInfo?.projectSlug,
      convexProjectInfo?.kind,
      shouldDeleteConvexProject,
    ],
  );

  const closeDialog = () => {
    setDialogContent(null);
    setShouldDeleteConvexProject(false);
  };

  const handleDeleteClick = useCallback((item: ChatHistoryItem) => {
    setDialogContent({ type: 'delete', item });
  }, []);

  const handleLogout = () => {
    setProfile(null);
    window.localStorage.removeItem(SESSION_ID_KEY);
    signOut({ returnTo: window.location.origin });
  };

  const handleSettingsClick = () => {
    window.location.pathname = '/settings';
  };

  // Don't show the page when logged out
  if (sessionId === null) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Sign in to view projects</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">You need to be signed in to view your projects.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex h-full flex-col bg-white dark:bg-gray-900 min-h-[800px] mt-16 rounded-t-3xl">
      <div className="border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-900 rounded-t-3xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Projects</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Manage and organize your development projects
            </p>
          </div>

          <div className="flex items-center gap-3">
            <TextInput
              id="search-projects"
              type="search"
              placeholder="Search projects..."
              onChange={handleSearchChange}
              aria-label="Search projects"
              className="max-w-md"
            />

            {profile && (
              <MenuComponent
                placement="top-start"
                buttonProps={{
                  variant: 'neutral',
                  title: 'User menu',
                  inline: true,
                  className: 'rounded-full',
                  icon: profile.avatar ? (
                    <img
                      src={profile.avatar}
                      className="size-8 min-w-8 rounded-full object-cover"
                      loading="eager"
                      decoding="sync"
                    />
                  ) : (
                    <PersonIcon className="size-8 min-w-8 rounded-full border text-content-secondary" />
                  ),
                }}
              >
                <FeedbackButton showInMenu={true} />
                <DiscordButton showInMenu={true} />
                <hr />
                <MenuItemComponent action={handleSettingsClick}>
                  <GearIcon className="text-content-secondary" />
                  Settings & Usage
                </MenuItemComponent>
                <MenuItemComponent action={handleLogout}>
                  <ExitIcon className="text-content-secondary" />
                  Log out
                </MenuItemComponent>
              </MenuComponent>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 py-6">
        {filteredList.length === 0 && (
          <div className="flex h-64 items-center justify-center">
            <div className="text-center">
              <div className="text-4xl">📁</div>
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">
                {list.length === 0 ? 'No projects yet' : 'No matches found'}
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {list.length === 0
                  ? 'Start your first project to see it listed here.'
                  : 'Try adjusting your search terms.'}
              </p>
              {list.length === 0 && (
                <Button className="mt-4" href="/" icon={<PlusIcon />}>
                  Create your first project
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Projects grouped by date */}
        <div className="space-y-8">
          {binDates(filteredList).map(({ category, items }) => (
            <div key={category} className="space-y-4">
              <div className="flex items-center">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{category}</h2>
                <div className="ml-3 rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                  {items.length}
                </div>
              </div>

              {/* Grid layout for projects */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {items.map((item) => (
                  <div key={item.initialId}>
                    <HistoryItem item={item} handleDeleteClick={handleDeleteClick} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Delete confirmation dialog */}
      {dialogContent?.type === 'delete' && (
        <ConfirmationDialog
          onClose={closeDialog}
          confirmText={'Delete'}
          onConfirm={() => {
            if (dialogContent?.type === 'delete') {
              deleteItem(dialogContent.item);
            }
            closeDialog();
            return Promise.resolve();
          }}
          dialogTitle="Delete Project"
          validationText={dialogContent?.item.description || 'New project...'}
          dialogBody={
            <>
              <p>
                You are about to delete{' '}
                <span className="font-medium text-content-primary">
                  {dialogContent?.item.description || 'New project...'}
                </span>
              </p>
              {convexProjectInfo?.kind === 'connected' && (
                <div className="mt-4 flex items-center gap-2">
                  <Checkbox
                    id="delete-convex-project"
                    checked={shouldDeleteConvexProject}
                    onChange={() => setShouldDeleteConvexProject(!shouldDeleteConvexProject)}
                  />
                  <label htmlFor="delete-convex-project" className="text-pretty text-content-secondary">
                    Also delete the associated Convex project (
                    <a
                      href={`https://dashboard.convex.dev/p/${convexProjectInfo.projectSlug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-content-link hover:underline"
                    >
                      {convexProjectInfo.projectSlug}
                    </a>
                    )
                  </label>
                </div>
              )}
            </>
          }
        />
      )}
    </div>
  );
});

Projects.displayName = 'Projects';
