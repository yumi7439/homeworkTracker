import { supabase } from './client'

const POSTS = 'homeworkPosts'
function unwrap({ data, error }) {
  if (error) throw new Error(error.message)
  return data
}
// Required by the schema; ownership controls can be added later.
function authorId() {
  const key = 'homeworkboard-author-id'
  let id = localStorage.getItem(key)
  if (!id) { id = crypto.randomUUID(); localStorage.setItem(key, id) }
  return id
}
export async function listPosts() {
  return unwrap(await supabase.from(POSTS).select('id,title,created_at,upvotes,due_at').order('created_at', { ascending: false }))
}
export async function getPost(id) {
  return unwrap(await supabase.from(POSTS).select('*').eq('id', id).maybeSingle())
}
export async function createPost(values) {
  return unwrap(await supabase.from(POSTS).insert({ ...values, author_id: authorId() }).select().single())
}
export async function updatePost(id, values) {
  return unwrap(await supabase.from(POSTS).update({ ...values, updated_at: new Date().toISOString() }).eq('id', id).select().single())
}
export async function deletePost(id) {
  // The comments foreign key uses ON DELETE CASCADE.
  const rows = unwrap(await supabase.from(POSTS).delete().eq('id', id).select('id'))
  if (!rows.length) throw new Error('Post could not be deleted. It may already be gone, or access was denied.')
}
export async function listComments(id) {
  return unwrap(await supabase.from('comments').select('*').eq('post_id', id).order('created_at', { ascending: true }))
}
export async function addComment(id, content) {
  return unwrap(await supabase.from('comments').insert({ post_id: id, content, author_id: authorId() }).select().single())
}
export async function increaseImportance(id) {
  // Compare-and-swap avoids lost votes without requiring a new database function.
  for (let attempt = 0; attempt < 8; attempt++) {
    const post = unwrap(await supabase.from(POSTS).select('upvotes').eq('id', id).maybeSingle())
    if (!post) throw new Error('This post no longer exists.')
    const rows = unwrap(await supabase.from(POSTS).update({ upvotes: post.upvotes + 1 }).eq('id', id).eq('upvotes', post.upvotes).select('upvotes'))
    if (rows.length) return rows[0].upvotes
  }
  throw new Error('Your vote could not be saved. Please try again.')
}
