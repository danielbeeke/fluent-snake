const originalFetch = window.fetch
export const fetch = async function (url: string): Promise<string> {
  const response = await originalFetch(url)
  return await response.json()  
}