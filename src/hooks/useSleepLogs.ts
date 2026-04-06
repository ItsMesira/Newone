import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export function useSleepLogs() {
  const { data, error, isLoading, mutate } = useSWR('/api/sleep-logs', fetcher)

  return {
    logs: data?.data || [],
    isLoading,
    isError: error,
    mutate
  }
}
