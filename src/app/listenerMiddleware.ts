import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit'
import {
  deleteAllCompleted,
  openAllCompleted,
  taskAdded,
  taskDeleted,
  taskModified,
  tasksGroupAdded,
  tasksGroupCollapsed,
  tasksGroupDeleted,
  tasksGroupLastActive,
  tasksGroupMerged,
  tasksReordered,
  taskToggled,
  setPrioritiesEnabled, // 🟣 hinzufügen
  setPriorityFilter,    // (optional, falls du Filteränderungen auch speichern willst)
} from '../features/tasks/tasks-slice'

const listenerMiddleware = createListenerMiddleware()

// === 1️⃣ Gruppenaktivität verfolgen ===
const actionsWithGroup = isAnyOf(
  taskAdded,
  taskModified,
  taskToggled,
  taskDeleted,
  openAllCompleted,
  deleteAllCompleted,
  tasksReordered,
  tasksGroupAdded,
  tasksGroupDeleted,
  tasksGroupMerged,
  tasksGroupCollapsed
)

listenerMiddleware.startListening({
  matcher: actionsWithGroup,
  effect: async ({ payload }, listenerApi) => {
    const { groupName } = payload
    listenerApi.dispatch(tasksGroupLastActive({ groupName }))
  },
})

// === 2️⃣ ALLES speichern, wenn sich etwas Relevantes ändert ===
listenerMiddleware.startListening({
  matcher: isAnyOf(
    taskAdded,
    taskModified,
    taskDeleted,
    taskToggled,
    openAllCompleted,
    deleteAllCompleted,
    tasksReordered,
    tasksGroupAdded,
    tasksGroupDeleted,
    tasksGroupMerged,
    tasksGroupCollapsed,
    setPrioritiesEnabled, // 🟣 unser Toggle
    setPriorityFilter      // optional: Filterwechsel speichern
  ),
  effect: async (_, listenerApi) => {
    try {
      const state = listenerApi.getState() as any
      const note = (window as any).note
      const editorKit = (window as any).editorKit
      if (!note || !editorKit) return

      note.content.text = JSON.stringify(state.tasks, null, 2)
      // ✨ EditorKit benachrichtigen, damit SN speichert:
      if (editorKit.onNoteValueChange) {
        editorKit.onNoteValueChange(note)
      }
    } catch (error) {
      console.warn('⚠️ Could not persist note:', error)
    }
  },
})

export default listenerMiddleware.middleware
