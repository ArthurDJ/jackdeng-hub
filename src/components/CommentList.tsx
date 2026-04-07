import { getPayload } from '@/lib/payload'

type Props = {
  postId: string
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-AU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')

  // Deterministic hue from name string
  const hue = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360

  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0 select-none"
      style={{ backgroundColor: `hsl(${hue} 50% 50%)` }}
      aria-hidden="true"
    >
      {initials || '?'}
    </div>
  )
}

export async function CommentList({ postId }: Props) {
  const payload = await getPayload()

  const { docs: comments, totalDocs } = await payload.find({
    collection: 'comments',
    where: {
      and: [
        { post: { equals: postId } },
        { status: { equals: 'approved' } },
      ],
    },
    sort: 'createdAt',
    limit: 100,
    overrideAccess: true,
  })

  return (
    <section aria-labelledby="comments-heading">
      <h2
        id="comments-heading"
        className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-6"
      >
        {totalDocs === 0
          ? 'No comments yet'
          : `${totalDocs} comment${totalDocs === 1 ? '' : 's'}`}
      </h2>

      {totalDocs === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Be the first to leave a comment below.
        </p>
      ) : (
        <ol className="space-y-6">
          {comments.map((comment) => (
            <li
              key={comment.id}
              className="flex gap-3"
            >
              <Avatar name={comment.authorName} />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {comment.authorName}
                  </span>
                  <time
                    dateTime={comment.createdAt}
                    className="text-xs text-zinc-400 dark:text-zinc-500"
                  >
                    {formatDate(comment.createdAt)}
                  </time>
                </div>
                <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap break-words">
                  {comment.content}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
