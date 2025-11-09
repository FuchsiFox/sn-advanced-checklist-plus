import React, { useEffect, useMemo, useState } from 'react'
import {
  DragDropContext,
  Draggable,
  Droppable,
  DropResult,
} from 'react-beautiful-dnd'

import { useAppDispatch, useAppSelector } from '../../app/hooks'
import {
  setPriorityFilter,
  setPrioritiesEnabled,
  tasksGroupReordered,
  setTheme,
} from './tasks-slice'

import TaskGroup from './TaskGroup'

/* === Kopfzeile mit Theme-Toggle, Prioritäten-Toggle & Filtern === */
const PriorityFilter: React.FC = () => {
  const dispatch = useAppDispatch()

  const currentFilter = useAppSelector((s) => s.tasks.priorityFilter)
  const prioritiesEnabled = useAppSelector((s) => s.tasks.prioritiesEnabled)

  // 🔦 Theme aus Redux; Fallback auf Systempräferenz, falls (noch) nicht gesetzt
  const themeFromStore = useAppSelector((s) => s.tasks.theme)
  const systemPrefersDark = useMemo(
    () =>
      typeof window !== 'undefined' &&
      !!window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches,
    []
  )
  const theme: 'light' | 'dark' = themeFromStore ?? (systemPrefersDark ? 'dark' : 'light')

  // Wende Theme auf <html data-theme="..."> an
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme === 'dark' ? 'dark' : 'light')
  }, [theme])

  type PriorityValue = 'low' | 'medium' | 'high' | 'all'
  const filters: { value: Exclude<PriorityValue, 'all'>; label: string }[] = [
    { value: 'low', label: '🟢' },
    { value: 'medium', label: '🟠' },
    { value: 'high', label: '🔴' },
  ]

  const allTasks = useAppSelector((state) => state.tasks.groups.flatMap((g) => g.tasks))

  const priorityCounts = {
    low: allTasks.filter((t) => !t.completed && t.priority === 'low').length,
    medium: allTasks.filter((t) => !t.completed && t.priority === 'medium').length,
    high: allTasks.filter((t) => !t.completed && t.priority === 'high').length,
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
        padding: '0 6px',
      }}
    >
      {/* 🌗 Theme Toggle (persistiert via Redux) */}
      <button
        onClick={() => dispatch(setTheme(theme === 'dark' ? 'light' : 'dark'))}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'transparent',
          color: 'var(--sn-stylekit-foreground-color)',
          border: '1px solid transparent',
          cursor: 'pointer',
          fontSize: 12,
          padding: '4px 8px',
          borderRadius: 6,
          opacity: 0.85,
          transition: 'opacity .2s ease',
        }}
        title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        <span style={{ fontSize: 14 }}>{theme === 'dark' ? '🌙' : '☀️'}</span>
        <span style={{ fontWeight: 500 }}>{theme === 'dark' ? 'Dark' : 'Light'}</span>
      </button>

      {/* ⚙️ Prioritäten aktiv/deaktivieren */}
      <button
        onClick={() => dispatch(setPrioritiesEnabled(!prioritiesEnabled))}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          fontSize: 12,
          color: 'var(--sn-stylekit-foreground-color)',
          opacity: 0.8,
        }}
        title="Prioritäten aktivieren/deaktivieren"
      >
        {prioritiesEnabled ? '🔴 Priorities ON' : '⚪ Priorities OFF'}
      </button>

      {/* 🟢🟠🔴 Priority Filter – nur wenn Prioritäten aktiv sind */}
      {prioritiesEnabled && (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {filters.map((f) => {
            const isActive = f.value === currentFilter
            const count = priorityCounts[f.value as keyof typeof priorityCounts]
            return (
              <div
                key={f.value}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  minWidth: 48,
                  marginRight: 6,
                }}
              >
                <button
                  onClick={() => {
                    const newFilter: PriorityValue =
                      f.value === currentFilter ? 'all' : f.value
                    dispatch(setPriorityFilter(newFilter))
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 18,
                    padding: 4,
                    opacity: isActive ? 1 : 0.55,
                    transform: isActive ? 'scale(1.1)' : 'scale(1)',
                    transition: 'all .15s ease',
                  }}
                  title={`Nur ${f.value}-Priorität anzeigen`}
                >
                  {f.label}
                </button>
                <span
                  style={{
                    fontSize: 12,
                    minWidth: 16,
                    textAlign: 'left',
                    color: 'var(--sn-stylekit-foreground-color)',
                    opacity: 0.9,
                  }}
                >
                  {count}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* === TASK GROUP LIST === */
const TaskGroupList: React.FC = () => {
  const dispatch = useAppDispatch()
  const canEdit = useAppSelector((state) => state.settings.canEdit)
  const groupedTasks = useAppSelector((state) => state.tasks.groups)
  const prioritiesEnabled = useAppSelector((state) => state.tasks.prioritiesEnabled)

  // Wenn Prioritäten-Toggle wechselt, zwingen wir Child-Komponenten zu einem Re-Render
  const [refreshFlag, setRefreshFlag] = useState(0)
  useEffect(() => {
    setRefreshFlag((f) => f + 1)
  }, [prioritiesEnabled])

  function onDragEnd(result: DropResult) {
    if (!result.destination) return
    const { source, destination } = result
    if (!destination) return

    dispatch(
      tasksGroupReordered({
        swapGroupIndex: source.index,
        withGroupIndex: destination.index,
      })
    )
  }

  return (
    <>
      <PriorityFilter />
      <DragDropContext data-testid="task-group-list" onDragEnd={onDragEnd}>
        <Droppable droppableId="droppable-task-group-list" isDropDisabled={!canEdit}>
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
              {groupedTasks.map((group, index) => (
                <Draggable
                  key={`draggable-${group.name}`}
                  draggableId={`draggable-${group.name}`}
                  index={index}
                  isDragDisabled={!canEdit}
                >
                  {({ innerRef, draggableProps, dragHandleProps }, { isDragging }) => {
                    const { onTransitionEnd, ...restDraggableProps } = draggableProps
                    return (
                      <TaskGroup
                        key={`group-${group.name}`}
                        group={group}
                        isDragging={isDragging}
                        innerRef={innerRef}
                        onTransitionEnd={onTransitionEnd}
                        onDragStart={dragHandleProps?.onDragStart}
                        isLast={groupedTasks.length - 1 === index}
                        refreshFlag={refreshFlag}
                        {...dragHandleProps}
                        {...restDraggableProps}
                      />
                    )
                  }}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </>
  )
}

export default TaskGroupList
