export type CustomCategory = {
  id: string
  label: string
  color: string
}

export type WorkshopRow = {
  id: string
  title: string
  data: {
    startTime?: string
    endTime?: string
    bolker?: unknown[]
    categories?: CustomCategory[]
  }
  owner_id: string | null
  read_token: string
  created_at: string
  updated_at: string
}


export type BolkType = 'activity' | 'pause' | 'info' | 'section'
