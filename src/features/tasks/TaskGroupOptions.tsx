import { useState } from 'react'
import { Menu, MenuList, MenuButton, MenuItem } from '@reach/menu-button'
import VisuallyHidden from '@reach/visually-hidden'

import { useAppDispatch, useAppSelector } from '../../app/hooks'
import {
  tasksGroupDeleted,
  tasksGroupProgressToggled,
  taskToggled,
} from './tasks-slice'
import { store } from '../../app/store'
import { TaskPayload } from './tasks-slice'

import {
  MoreIcon,
  MergeIcon,
  TrashIcon,
  RenameIcon,
  CheckCircleIcon,
} from '../../common/components/icons'

import { ConfirmDialog } from '../../common/components'

import MergeTaskGroups from './MergeTaskGroups'
import RenameTaskGroups from './RenameTaskGroups'

type TaskGroupOptionsProps = {
  groupName: string
}

const TaskGroupOptions: React.FC<TaskGroupOptionsProps> = ({ groupName }) => {
  const dispatch = useAppDispatch()
  const group = useAppSelector((s) =>
    s.tasks.groups.find((g) => g.name === groupName)
  )

  const [showMergeDialog, setShowMergeDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showRenameDialog, setShowRenameDialog] = useState(false)

  const showProgress = !!group?.showProgress

  // ✅ Neue Funktion: Alle Aufgaben als erledigt markieren
  const markAllCompleted = () => {
    const state = store.getState()
    const group = state.tasks.groups.find((g) => g.name === groupName)
    if (!group) return

    group.tasks.forEach((task: TaskPayload) => {
      if (!task.completed) {
        dispatch(taskToggled({ id: task.id, groupName }))
      }
    })
  }

  return (
    <>
      <Menu>
        <MenuButton data-testid="task-group-options" className="sn-icon-button">
          <VisuallyHidden>Options for '{groupName}' group</VisuallyHidden>
          <MoreIcon />
        </MenuButton>
        <MenuList>
          {/* ✅ Alle Aufgaben als erledigt markieren */}
          <MenuItem onSelect={markAllCompleted}>
            <CheckCircleIcon />
            <span className="px-1">Mark all as done</span>
          </MenuItem>

          {/* Fortschrittsanzeige umschalten */}
          <MenuItem
            onSelect={() =>
              dispatch(
                tasksGroupProgressToggled({ groupName, show: !showProgress })
              )
            }
            title="Show/Hide progress bar and count"
          >
            <span style={{ width: 18, display: 'inline-block' }}>
              {showProgress ? '✓' : ''}
            </span>
            <span className="px-1">Show progress</span>
          </MenuItem>

          {/* Gruppe löschen */}
          <MenuItem
            data-testid="delete-task-group"
            onSelect={() => setShowDeleteDialog(true)}
          >
            <TrashIcon />
            <span className="px-1">Delete group</span>
          </MenuItem>

          {/* Mit anderer Gruppe zusammenführen */}
          <MenuItem
            data-testid="merge-task-group"
            onSelect={() => setShowMergeDialog(true)}
          >
            <MergeIcon />
            <span className="px-1">Merge into another group</span>
          </MenuItem>

          {/* Umbenennen */}
          <MenuItem
            data-testid="rename-task-group"
            onSelect={() => setShowRenameDialog(true)}
          >
            <RenameIcon />
            <span className="px-1">Rename</span>
          </MenuItem>
        </MenuList>
      </Menu>

      {/* Dialoge */}
      {showDeleteDialog && (
        <ConfirmDialog
          testId="delete-task-group-dialog"
          title="Delete group"
          confirmButtonText="Delete"
          confirmButtonStyle="danger"
          confirmButtonCb={() => dispatch(tasksGroupDeleted({ groupName }))}
          cancelButtonCb={() => setShowDeleteDialog(false)}
        >
          Are you sure you want to delete the group "
          <strong>{groupName}</strong>"?
        </ConfirmDialog>
      )}
      {showMergeDialog && (
        <MergeTaskGroups
          groupName={groupName}
          handleClose={() => setShowMergeDialog(false)}
        />
      )}
      {showRenameDialog && (
        <RenameTaskGroups
          groupName={groupName}
          handleClose={() => setShowRenameDialog(false)}
        />
      )}
    </>
  )
}

export default TaskGroupOptions
