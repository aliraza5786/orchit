export interface MindMapNode {
  id: string
  x: number
  y: number
  width: number
  height: number
  content: string
  shape: 'rectangle' | 'rounded' | 'circle' | 'diamond'
  backgroundColor: string
  borderColor: string
  textColor: string
  fontSize: number
  children?: string[]
}

export interface MindMapConnection {
  id: string
  sourceId: string
  targetId: string
  label?: string
  style: 'curved' | 'straight' | 'elbow'
  color: string
  thickness: number
  dashPattern?: string
}

export interface MindMapData {
  nodes: MindMapNode[]
  connections: MindMapConnection[]
  metadata?: {
    version: string
    created: string
    modified: string
  }
}

export interface Position {
  x: number
  y: number
}

export type LayoutType = 'manual' | 'tree' | 'radial' | 'force'
