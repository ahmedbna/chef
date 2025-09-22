import { useParams } from '@remix-run/react';
import { classNames } from '~/utils/classNames';
import { type ChatHistoryItem } from '~/types/ChatHistoryItem';
import { useEditChatDescription } from '~/lib/hooks/useEditChatDescription';
import { CheckIcon, Pencil1Icon, TrashIcon } from '@radix-ui/react-icons';
import { Button } from '@ui/Button';
import { TextInput } from '@ui/TextInput';

interface HistoryItemProps {
  item: ChatHistoryItem;
  handleDeleteClick: (item: ChatHistoryItem) => void;
}

export function HistoryItem({ item, handleDeleteClick }: HistoryItemProps) {
  const { id: urlId } = useParams();
  const isActiveChat = urlId === item.id;

  const { editing, handleChange, handleBlur, handleSubmit, handleKeyDown, currentDescription, toggleEditMode } =
    useEditChatDescription({
      initialDescription: item.description,
      customChatId: item.id,
      syncWithGlobalStore: isActiveChat,
    });

  // Chats get a description from the first message, so have a fallback so
  // they render reasonably
  const description = currentDescription ?? 'New chat…';

  return (
    <div
      className={classNames('group relative rounded-lg border p-4 transition-all duration-200', {
        // Active state
        'border-blue-200 bg-blue-50 text-gray-900 dark:border-blue-700 dark:bg-blue-900/20 dark:text-white':
          isActiveChat,
        // Inactive state
        'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-gray-600 dark:hover:bg-gray-750 dark:hover:text-white':
          !isActiveChat,
      })}
    >
      {editing ? (
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <TextInput
            labelHidden
            id="description"
            className="flex-1"
            autoFocus
            value={currentDescription}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
          />
          <Button
            type="submit"
            variant="neutral"
            icon={<CheckIcon />}
            size="xs"
            inline
            onClick={handleSubmit}
            className="shrink-0"
          />
        </form>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <a
            href={`/chat/${item.urlId ?? item.initialId}`}
            className="flex-1 truncate text-sm font-medium hover:text-inherit"
          >
            {description}
          </a>

          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <ChatActionButton
              toolTipContent="Rename"
              icon={<Pencil1Icon />}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                toggleEditMode();
              }}
            />
            <ChatActionButton
              toolTipContent="Delete"
              icon={<TrashIcon />}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                handleDeleteClick(item);
              }}
              className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
            />
          </div>
        </div>
      )}
    </div>
  );
}

const ChatActionButton = ({
  toolTipContent,
  icon,
  className,
  onClick,
}: {
  toolTipContent: string;
  icon: React.ReactNode;
  className?: string;
  onClick: (e: React.MouseEvent) => void;
}) => {
  return (
    <Button
      variant="neutral"
      icon={icon}
      inline
      size="xs"
      tip={toolTipContent}
      className={classNames(
        'h-6 w-6 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-gray-300',
        className,
      )}
      onClick={onClick}
    />
  );
};
