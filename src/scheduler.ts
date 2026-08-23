/**
 * A single scroll/resize listener and a single animation frame, shared by
 * every card on the page.
 *
 * Cards subscribe a measure-and-write task. Tasks run at most once per frame,
 * in subscription order. When the last subscriber leaves, the listeners are
 * removed, so a page that uses no effects costs nothing.
 */

type Task = () => void;

const tasks = new Set<Task>();
let frameId = 0;
let listening = false;

function flush(): void {
  frameId = 0;
  // Copy first: a task that unsubscribes mid-flush must not skip its peers.
  for (const task of Array.from(tasks)) task();
}

function schedule(): void {
  if (frameId !== 0) return;
  frameId = requestAnimationFrame(flush);
}

function startListening(): void {
  if (listening) return;
  // `capture` catches scrolls inside nested scroll containers too, which a
  // listener bound to `window` alone would miss.
  window.addEventListener('scroll', schedule, { passive: true, capture: true });
  window.addEventListener('resize', schedule, { passive: true });
  listening = true;
}

function stopListening(): void {
  if (!listening) return;
  window.removeEventListener('scroll', schedule, true);
  window.removeEventListener('resize', schedule);
  if (frameId !== 0) {
    cancelAnimationFrame(frameId);
    frameId = 0;
  }
  listening = false;
}

/**
 * Register a task to run on scroll and resize. Returns an unsubscribe
 * function. The task also runs once immediately, on the next frame, so a card
 * that mounts mid-scroll starts in the right state.
 */
export function subscribe(task: Task): () => void {
  tasks.add(task);
  startListening();
  schedule();

  return () => {
    tasks.delete(task);
    if (tasks.size === 0) stopListening();
  };
}

/** Force every subscribed task to run on the next frame. */
export function refresh(): void {
  schedule();
}

/** Test seam. Not part of the public API. */
export function __activeTaskCount(): number {
  return tasks.size;
}
