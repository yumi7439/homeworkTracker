import { useEffect, useState } from 'react'
import * as db from './data'
import './App.css'

const date = value => new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
const postLink = id => `#/posts/${id}`
// datetime-local inputs need local calendar values, not a UTC ISO string.
function localDateTime(value) {
  if (!value) return ''
  const d = new Date(value)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
function DueDate({ value }) {
  return value ? <p className="due-date">Due: <time dateTime={value}>{date(value)}</time></p> : null
}
function ErrorMessage({ message }) { return message ? <div className="error" role="alert">{message}</div> : null }
function Loading() { return <p className="loading" role="status">Loading…</p> }
function Empty({ title, text }) { return <section className="empty"><span className="empty-icon" aria-hidden="true">▤</span><h2>{title}</h2><p>{text}</p><a className="text-link" href="#/">Back to the board →</a></section> }

export default function App() {
  const [route, setRoute] = useState(location.hash || '#/')
  useEffect(() => {
    const change = () => { setRoute(location.hash || '#/'); window.scrollTo(0, 0) }
    window.addEventListener('hashchange', change)
    return () => window.removeEventListener('hashchange', change)
  }, [])
  const parts = route.replace(/^#\/?/, '').split('/').filter(Boolean)
  let page
  if (!parts.length) page = <Feed />
  else if (parts[0] === 'create' && parts.length === 1) page = <PostForm />
  else if (parts[0] === 'posts' && parts[1] && parts.length === 2) page = <PostPage id={parts[1]} />
  else if (parts[0] === 'posts' && parts[1] && parts[2] === 'edit' && parts.length === 3) page = <EditPage id={parts[1]} />
  else page = <Empty title="Page not found" text="Head back to your homework board." />
  return <><header className="site-header"><a className="brand" href="#/"><span className="brand-mark" aria-hidden="true">h.</span>homework<span className="brand-light">board</span></a><nav aria-label="Main navigation"><a className={!parts.length ? 'nav-active' : ''} href="#/">The board</a><a className="button small" href="#/create">+ New post</a></nav></header><main key={route}>{page}</main><footer>Homework, a little more organized.<span>One board. All your assignments.</span></footer></>
}

function Feed() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('created_at')
  useEffect(() => {
    let active = true
    db.listPosts().then(data => { if (active) setPosts(data) }).catch(e => { if (active) setError(e.message) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])
  const visible = posts.filter(p => p.title.toLowerCase().includes(search.toLowerCase().trim())).sort((a, b) => sort === 'upvotes' ? b.upvotes - a.upvotes || new Date(b.created_at) - new Date(a.created_at) : new Date(b.created_at) - new Date(a.created_at))
  return <><section className="intro"><div><p className="eyebrow">A LITTLE CLARITY FOR YOUR CLASSES</p><h1>Your homework.<br /><em>All in one place.</em></h1><p className="subtitle">Keep track of assignments, share the details, and bring<br className="desktop-break" /> the important stuff to the top.</p><a className="button" href="#/create">Create a homework post <span aria-hidden="true">↗</span></a></div><aside className="note"><span className="note-pin" aria-hidden="true">✳</span><p>A note to self</p><h2>Less “what was<br />the homework?”<br />More getting it done.</h2><span className="note-bottom">YOU’VE GOT THIS. <span aria-hidden="true">✧</span></span></aside></section><section aria-labelledby="feed-title"><div className="section-heading"><h2 id="feed-title">The homework board <span className="count">{posts.length}</span></h2><p>Small steps, steady progress.</p></div><div className="toolbar"><label className="search"><span aria-hidden="true">⌕</span><input aria-label="Search posts by title" placeholder="Find a homework post…" value={search} onChange={e => setSearch(e.target.value)} /></label><label className="sort">Sort by <select value={sort} onChange={e => setSort(e.target.value)}><option value="created_at">Newest first</option><option value="upvotes">Most important</option></select></label></div><ErrorMessage message={error} />{loading ? <Loading /> : !error && (visible.length ? <div className="post-list">{visible.map(post => <a className="post-card" href={postLink(post.id)} key={post.id}><div><time dateTime={post.created_at}>Created: {date(post.created_at)}</time><h3>{post.title}</h3><DueDate value={post.due_at} /></div><span className="importance"><span aria-hidden="true">↑</span><strong>{post.upvotes}</strong><span>importance</span></span></a>)}</div> : <Empty title={search.trim() ? 'No matching homework' : 'A fresh start for your homework'} text={search.trim() ? 'Try another title or clear your search.' : 'Create your first post to get your board started.'} />)}</section></>
}

function PostForm({ post }) {
  const [title, setTitle] = useState(post?.title || '')
  const [content, setContent] = useState(post?.content || '')
  const [image, setImage] = useState(post?.image_url || '')
  const [dueAt, setDueAt] = useState(() => localDateTime(post?.due_at))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  async function submit(e) {
    e.preventDefault()
    if (!title.trim()) { setError('Please add a homework title.'); return }
    if (image.trim() && !/^https?:\/\//i.test(image.trim())) { setError('Use an image URL starting with https:// or http://.'); return }
    setSaving(true); setError('')
    try {
      const values = { title: title.trim(), content: content.trim() || null, image_url: image.trim() || null, due_at: dueAt ? new Date(dueAt).toISOString() : null }
      const saved = post ? await db.updatePost(post.id, values) : await db.createPost(values)
      location.hash = postLink(saved.id)
    } catch (e) { setError(e.message) } finally { setSaving(false) }
  }
  return <section className="narrow"><a className="back-link" href={post ? postLink(post.id) : '#/'}>← {post ? 'Back to post' : 'Back to the board'}</a><p className="eyebrow">MAKE ROOM FOR THE DETAILS</p><h1>{post ? 'Edit homework' : 'A new homework post'}</h1><p className="subtitle">A clear title is all you need. Add the rest when it helps.</p><form className="panel form" onSubmit={submit}><ErrorMessage message={error} /><label>Homework title <span className="required">required</span><input required maxLength={240} value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Finish chapter 4 practice problems" /></label><label>Due date and time <span className="optional">optional</span><input type="datetime-local" value={dueAt} onChange={e => setDueAt(e.target.value)} /><small>Choose a deadline in your local time. Leave blank for no deadline.</small></label><label>Additional details <span className="optional">optional</span><textarea rows={7} value={content} onChange={e => setContent(e.target.value)} placeholder="Instructions, questions, or anything worth remembering…" /></label><label>Image URL <span className="optional">optional</span><input type="url" value={image} onChange={e => setImage(e.target.value)} placeholder="https://example.com/assignment.jpg" /><small>Paste a direct link to an image of your assignment.</small></label><div className="form-actions"><a className="secondary button" href={post ? postLink(post.id) : '#/'}>Cancel</a><button disabled={saving} type="submit">{saving ? 'Saving…' : post ? 'Save changes' : 'Create post'} <span aria-hidden="true">↗</span></button></div></form></section>
}

function usePost(id) {
  const [post, setPost] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let active = true
    db.getPost(id).then(data => { if (active) setPost(data) }).catch(e => { if (active) setError(e.message) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id])
  return { post, setPost, error, loading }
}
function EditPage({ id }) {
  const { post, error, loading } = usePost(id)
  if (loading) return <Loading />
  if (error) return <ErrorMessage message={error} />
  return post ? <PostForm post={post} /> : <Empty title="Post not found" text="This homework post may have been deleted." />
}

function PostPage({ id }) {
  const { post, setPost, error, loading } = usePost(id)
  const [actionError, setActionError] = useState('')
  const [voting, setVoting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [imageFailed, setImageFailed] = useState(false)
  async function vote() {
    setVoting(true); setActionError('')
    try { const count = await db.increaseImportance(id); setPost(p => ({ ...p, upvotes: count })) }
    catch (e) { setActionError(e.message) } finally { setVoting(false) }
  }
  async function remove() {
    setDeleting(true); setActionError('')
    try { await db.deletePost(id); location.hash = '#/' }
    catch (e) { setActionError(e.message); setDeleting(false) }
  }
  if (loading) return <Loading />
  if (error) return <ErrorMessage message={error} />
  if (!post) return <Empty title="Post not found" text="This homework post may have been deleted." />
  return <section className="narrow"><a className="back-link" href="#/">← Back to the board</a><article className="panel detail"><time dateTime={post.created_at}>Created {date(post.created_at)}</time><h1>{post.title}</h1><DueDate value={post.due_at} />{post.content && <p className="post-content">{post.content}</p>}{post.image_url && (imageFailed ? <p className="muted">This image couldn’t be loaded.</p> : <img className="post-image" src={post.image_url} alt={`Image attached to ${post.title}`} onError={() => setImageFailed(true)} />)}<div className="post-actions"><button className="vote-button" disabled={voting || deleting} onClick={vote}>↑ {post.upvotes} · {voting ? 'Adding…' : 'Mark important'}</button><div><a className="text-link" href={`${postLink(id)}/edit`}>Edit post</a><button className="danger-link" disabled={deleting} onClick={() => setConfirmDelete(true)}>Delete</button></div></div><p className="vote-help">Each click adds one importance vote. Vote again whenever it deserves a boost.</p><ErrorMessage message={actionError} />{confirmDelete && <div className="delete-confirm" role="alert"><p>Delete this post and its comments? This cannot be undone.</p><div><button className="danger" disabled={deleting} onClick={remove}>{deleting ? 'Deleting…' : 'Yes, delete post'}</button><button className="secondary" disabled={deleting} onClick={() => setConfirmDelete(false)}>Keep post</button></div></div>}</article><Comments id={id} /></section>
}

function Comments({ id }) {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [reload, setReload] = useState(0)
  useEffect(() => {
    let active = true
    db.listComments(id).then(data => { if (active) setComments(data) }).catch(e => { if (active) setLoadError(e.message) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id, reload])
  async function submit(e) {
    e.preventDefault()
    if (!content.trim()) { setError('Write a comment before posting.'); return }
    setSaving(true); setError('')
    try { const comment = await db.addComment(id, content.trim()); setComments(previous => [...previous, comment]); setContent('') }
    catch (e) { setError(e.message) } finally { setSaving(false) }
  }
  return <section className="comments"><h2>Comments <span className="count">{comments.length}</span></h2><p className="muted">Questions, reminders, and a little help along the way.</p>{loading ? <Loading /> : loadError ? <><ErrorMessage message={loadError} /><button className="secondary" onClick={() => { setLoading(true); setLoadError(''); setReload(n => n + 1) }}>Retry comments</button></> : comments.length ? <div className="comment-list">{comments.map(comment => <article className="comment" key={comment.id}><time dateTime={comment.created_at}>{date(comment.created_at)}</time><p>{comment.content}</p></article>)}</div> : <p className="no-comments">No comments yet. Start the conversation.</p>}<form className="panel comment-form" onSubmit={submit}><label htmlFor="comment">Leave a comment</label><textarea id="comment" required rows={3} value={content} onChange={e => setContent(e.target.value)} placeholder="Add to the conversation…" /><ErrorMessage message={error} /><button type="submit" disabled={saving || loading || !!loadError}>{saving ? 'Posting…' : 'Post comment'} <span aria-hidden="true">↗</span></button></form></section>
}
