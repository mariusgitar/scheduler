export type WorkshopRow = {
  id: string
  title: string
  data: object
  owner_id: string | null
  read_token: string
  created_at: string
  updated_at: string
}


export type BolkType = 'activity' | 'pause' | 'info' | 'section'
