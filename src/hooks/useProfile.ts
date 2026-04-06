import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export function useProfile() {
  const { data, error, isLoading, mutate } = useSWR('/api/settings', fetcher)

  return {
    settings: data?.data || null,
    isLoading,
    isError: error,
    mutate
  }
}
