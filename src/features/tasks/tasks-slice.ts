import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import {
  arrayMoveImmutable,
  isJsonString,
  parseMarkdownTasks,
} from '../../common/utils'

export type Priority = 'none' | 'low' | 'medium' | 'high'

export type TaskPayload = {
  id: string
  description: string
  completed?: boolean
  createdAt: Date
  updatedAt?: Date
  completedAt?: Date
  priority?: Priority
}

export type GroupPayload = {
  name: string
  collapsed?: boolean
  draft?: string
  lastActive?: Date
  hideCompleted?: boolean
  /** ⬇ Show Progress existiert bereits (sichtbar im UI-Menü) */
  showProgress?: boolean
  tasks: TaskPayload[]
}


export type TasksState = {
  schemaVersion: string
  groups: GroupPayload[]
  initialized?: boolean
  legacyContent?: GroupPayload
  lastError?: string
  priorityFilter?: 'all' | 'low' | 'medium' | 'high'
  prioritiesEnabled?: boolean
  theme?: 'light' | 'dark'  // ← NEU (optional, damit Tests nicht brechen)
}


const initialState: TasksState = {
  schemaVersion: '1.0.0',
  groups: [],
  priorityFilter: 'all',
  prioritiesEnabled: true,
}

const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    tasksGroupProgressToggled(
      state,
      action: PayloadAction<{ groupName: string; show: boolean }>
      ) {
          const { groupName, show } = action.payload
          const group = state.groups.find((g) => g.name === groupName)
          if (group) {
            group.showProgress = show
          }
        },

    setTheme(state, action: PayloadAction<'light' | 'dark'>) {
      state.theme = action.payload
    },

    
    /** 🔧 Globaler Toggle */
    setPrioritiesEnabled(state, action: PayloadAction<boolean>) {
      state.prioritiesEnabled = action.payload
      // Wenn ausgeschaltet, Filter neutralisieren
      if (!state.prioritiesEnabled) {
        state.priorityFilter = 'all'
      }
    },

    setPriorityFilter(state, action: PayloadAction<'all' | 'low' | 'medium' | 'high'>) {
      state.priorityFilter = action.payload
    },

    /** 🔽 Per-Gruppe: erledigte aus/einblenden */
    tasksGroupHideCompletedToggled(
      state,
      action: PayloadAction<{ groupName: string; hide: boolean }>
    ) {
      const { groupName, hide } = action.payload
      const group = state.groups.find((g) => g.name === groupName)
      if (group) {
        group.hideCompleted = hide
      }
    },

    taskAdded(
      state,
      action: PayloadAction<{
        task: { id: string; description: string; priority?: Priority }
        groupName: string
      }>
    ) {
      const { groupName, task } = action.payload
      const group = state.groups.find((item) => item.name === groupName)
      if (!group) return
      delete group.draft

      if (!task.priority) task.priority = 'none'

      group.tasks.unshift({
        ...task,
        completed: false,
        createdAt: new Date(),
      })
    },

    taskModified(
      state,
      action: PayloadAction<{
        task: { id: string; description?: string; priority?: Priority }
        groupName: string
      }>
    ) {
      const { groupName, task } = action.payload
      const group = state.groups.find((item) => item.name === groupName)
      if (!group) return
      const currentTask = group.tasks.find((item) => item.id === task.id)
      if (!currentTask) return

      if (typeof task.description !== 'undefined') currentTask.description = task.description
      if (typeof task.priority !== 'undefined') currentTask.priority = task.priority
      currentTask.updatedAt = new Date()
    },

    taskDeleted(state, action: PayloadAction<{ id: string; groupName: string }>) {
      const { id, groupName } = action.payload
      const group = state.groups.find((item) => item.name === groupName)
      if (!group) return
      group.tasks = group.tasks.filter((task) => task.id !== id)
    },

    taskToggled(state, action: PayloadAction<{ id: string; groupName: string }>) {
      const { id, groupName } = action.payload
      const group = state.groups.find((item) => item.name === groupName)
      if (!group) return
      const currentTask = group.tasks.find((task) => task.id === id)
      if (!currentTask) return

      currentTask.completed = !currentTask.completed
      currentTask.updatedAt = new Date()
      if (currentTask.completed) {
        currentTask.completedAt = new Date()
      } else {
        delete currentTask.completedAt
      }

      // zuletzt geänderte nach oben
      const tasks = group.tasks.filter((task) => task.id !== id)
      group.tasks = [currentTask, ...tasks]
    },

    openAllCompleted(state, action: PayloadAction<{ groupName: string }>) {
      const { groupName } = action.payload
      const group = state.groups.find((item) => item.name === groupName)
      if (!group) return
      group.tasks.forEach((task) => {
        task.completed = false
        delete task.completedAt
      })
    },

    deleteAllCompleted(state, action: PayloadAction<{ groupName: string }>) {
      const { groupName } = action.payload
      const group = state.groups.find((item) => item.name === groupName)
      if (!group) return
      group.tasks = group.tasks.filter((task) => task.completed === false)
    },

    tasksReordered(
      state,
      action: PayloadAction<{
        groupName: string
        swapTaskIndex: number
        withTaskIndex: number
        isSameSection: boolean
      }>
    ) {
      const { groupName, swapTaskIndex, withTaskIndex, isSameSection } = action.payload
      if (!isSameSection) return
      const group = state.groups.find((item) => item.name === groupName)
      if (!group) return
      group.tasks = arrayMoveImmutable(group.tasks, swapTaskIndex, withTaskIndex)
    },

    tasksGroupAdded(state, action: PayloadAction<{ groupName: string }>) {
      const { groupName } = action.payload
      const group = state.groups.find((item) => item.name === groupName)
      if (group) return
      state.groups.push({
        name: groupName,
        tasks: [],
        hideCompleted: true, // 👈 default: erledigte einklappen
      })
    },

    tasksGroupReordered(
      state,
      action: PayloadAction<{ swapGroupIndex: number; withGroupIndex: number }>
    ) {
      const { swapGroupIndex, withGroupIndex } = action.payload
      state.groups = arrayMoveImmutable(state.groups, swapGroupIndex, withGroupIndex)
    },

    tasksGroupDeleted(state, action: PayloadAction<{ groupName: string }>) {
      const { groupName } = action.payload
      state.groups = state.groups.filter((item) => item.name !== groupName)
    },

    tasksGroupMerged(
      state,
      action: PayloadAction<{
        groupName: string
        mergeWith: string
      }>
    ) {
      const { groupName, mergeWith } = action.payload
      if (groupName === mergeWith) return
      const groupA = state.groups.find((item) => item.name === groupName)
      if (!groupA) return
      const groupB = state.groups.find((item) => item.name === mergeWith)
      if (!groupB) return

      groupA.name = mergeWith
      groupA.tasks = [...(groupB.tasks ?? []), ...groupA.tasks]
      state.groups = state.groups.filter((group) => group !== groupB)
    },

    tasksGroupRenamed(
      state,
      action: PayloadAction<{
        groupName: string
        newName: string
      }>
    ) {
      const { groupName, newName } = action.payload
      if (groupName === newName) return
      const groupA = state.groups.find((item) => item.name === groupName)
      if (!groupA) return
      groupA.name = newName
    },

    tasksGroupCollapsed(
      state,
      action: PayloadAction<{ groupName: string; collapsed: boolean }>
    ) {
      const { groupName, collapsed } = action.payload
      const group = state.groups.find((item) => item.name === groupName)
      if (!group) return
      group.collapsed = collapsed
    },

    tasksGroupDraft(
      state,
      action: PayloadAction<{ groupName: string; draft: string }>
    ) {
      const { groupName, draft } = action.payload
      const group = state.groups.find((item) => item.name === groupName)
      if (!group) return
      group.draft = draft
    },

    tasksGroupLastActive(state, action: PayloadAction<{ groupName: string }>) {
      const { groupName } = action.payload
      const group = state.groups.find((item) => item.name === groupName)
      if (!group) return
      group.lastActive = new Date()
    },

    tasksLegacyContentMigrated(state, { payload }: PayloadAction<{ continue: boolean }>) {
      if (!state.legacyContent) return

      if (payload.continue) {
        state.initialized = true
        state.groups.push(state.legacyContent)
        delete state.lastError
      } else {
        state.initialized = false
        state.groups = []
        state.lastError =
          'The legacy content migration has been canceled by the user. ' +
          'Please reload this note to try again or switch to the Basic Checklist editor.'
      }

      delete state.legacyContent
    },

    tasksLoaded(state, { payload }: PayloadAction<string>) {
      if (!payload && !state.initialized) {
        payload = '{}'
      }

      try {
        const isJson = isJsonString(payload)
        if (!isJson) {
          const legacyContent = parseMarkdownTasks(payload)
          if (legacyContent) {
            state.legacyContent = legacyContent
            state.initialized = false
            return
          }
        }

        const parsedState = JSON.parse(payload) as Partial<TasksState>
const newState: TasksState = {
  schemaVersion: parsedState.schemaVersion ?? '1.0.0',
  groups: parsedState.groups ?? [],
  priorityFilter: parsedState.priorityFilter ?? 'all',
  prioritiesEnabled: parsedState.prioritiesEnabled ?? true,
  theme: parsedState.theme ?? state.theme,   // ← NEU
  initialized: true,
}

        // fehlende Defaults in Gruppen nachziehen
        newState.groups = newState.groups.map((g) => ({
          hideCompleted: g.hideCompleted ?? true,
          ...g,
        }))

        state.schemaVersion = newState.schemaVersion
    state.groups = newState.groups
    state.priorityFilter = newState.priorityFilter
    state.prioritiesEnabled = newState.prioritiesEnabled
    state.theme = newState.theme // ← NEU
    state.initialized = true
    delete state.lastError
  } catch (error: any) {
    state.initialized = false
    state.lastError = `An error has occurred while parsing the note's content: ${error}`
    return
  }
    },
  },
})

export const {
  setPrioritiesEnabled,
  setPriorityFilter,
  tasksGroupHideCompletedToggled,

  taskAdded,
  taskModified,
  taskToggled,
  taskDeleted,
  openAllCompleted,
  deleteAllCompleted,
  tasksLoaded,
  tasksLegacyContentMigrated,
  tasksGroupAdded,
  tasksReordered,
  tasksGroupReordered,
  tasksGroupDeleted,
  tasksGroupMerged,
  tasksGroupRenamed,
  tasksGroupCollapsed,
  tasksGroupDraft,
  tasksGroupLastActive,
  tasksGroupProgressToggled,
  setTheme,
} = tasksSlice.actions

export default tasksSlice.reducer
