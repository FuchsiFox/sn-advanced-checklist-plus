import React, { useState } from 'react'
import { DragDropContext, DropResult } from '@hello-pangea/dnd'
import styled from 'styled-components'

import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { groupTasksByCompletedStatus } from '../../common/utils'
import {
  GroupPayload,
  tasksReordered,
  tasksGroupHideCompletedToggled,
} from './tasks-slice'

import TasksContainer from './TasksContainer'
import CompletedTasksActions from './CompletedTasksActions'

const Container = styled.div`
  position: relative;
`

type TaskItemListProps = {
  group: GroupPayload
}

const TaskItemList: React.FC<TaskItemListProps> = ({ group }) => {
  const dispatch = useAppDispatch()
  const priorityFilter = useAppSelector((state) => state.tasks.priorityFilter)
  const { openTasks, completedTasks } = groupTasksByCompletedStatus(group.tasks)

  // Store-Wert: default true (eingeklappt), wenn undefined
  const hideCompleted = group.hideCompleted ?? true
  const [showCompleted, setShowCompleted] = useState<boolean>(!hideCompleted)

  const setShow = (visible: boolean) => {
    setShowCompleted(visible)
    dispatch(
      tasksGroupHideCompletedToggled({ groupName: group.name, hide: !visible })
    )
  }

  const filteredOpenTasks = openTasks.filter(
    (task) => priorityFilter === 'all' || task.priority === priorityFilter
  )
  const filteredCompletedTasks = completedTasks.filter(
    (task) => priorityFilter === 'all' || task.priority === priorityFilter
  )

  function onDragEnd(result: DropResult) {
    const droppedOutsideList = !result.destination
    if (droppedOutsideList) return

    const { source, destination } = result
    if (!destination) return

    dispatch(
      tasksReordered({
        groupName: group.name,
        swapTaskIndex: source.index,
        withTaskIndex: destination.index,
        isSameSection: source.droppableId === destination.droppableId,
      })
    )
  }

  return (
    <Container data-testid="task-list">
      <DragDropContext onDragEnd={onDragEnd}>
        {/* 🔹 Offene Aufgaben */}
        <TasksContainer
          testId="open-tasks-container"
          type="open"
          tasks={filteredOpenTasks}
          groupName={group.name}
        />

        {/* 🔹 Erledigte Aufgaben (ausblendbar) */}
        {filteredCompletedTasks.length > 0 && (
          <div style={{ marginTop: '8px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                userSelect: 'none',
                marginBottom: showCompleted ? '8px' : '0px',
                opacity: 0.8,
                color: 'var(--sn-stylekit-foreground-color)',
                fontSize: '0.9rem',
                fontWeight: 500,
                transition: 'opacity 0.2s ease, transform 0.2s ease',
              }}
              onClick={() => setShow(!showCompleted)}
              title={showCompleted ? 'Verbergen' : 'Anzeigen'}
            >
              <span
                style={{
                  marginRight: '6px',
                  display: 'inline-block',
                  transform: showCompleted ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease',
                }}
              >
                ▶
              </span>
              Completed tasks
            </div>

            {showCompleted && (
              <TasksContainer
                testId="completed-tasks-container"
                type="completed"
                tasks={filteredCompletedTasks}
                groupName={group.name}
              >
                <CompletedTasksActions groupName={group.name} />
              </TasksContainer>
            )}
          </div>
        )}
      </DragDropContext>
    </Container>
  )
}

export default TaskItemList
