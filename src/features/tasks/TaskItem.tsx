import './TaskItem.scss'
import {
  useState,
  ChangeEvent,
  createRef,
  KeyboardEvent,
  useEffect,
} from 'react'
import styled from 'styled-components'
import { useAppDispatch, useAppSelector, useDidMount } from '../../app/hooks'
import {
  taskDeleted,
  taskModified,
  TaskPayload,
  taskToggled,
} from './tasks-slice'
import { TextAreaInput } from '../../common/components'
import { Priority } from './tasks-slice'

const DISPATCH_OPENED_DELAY_MS = 300
const DISPATCH_COMPLETED_DELAY_MS = 300

const Container = styled.div<{
  completed?: boolean
  priority?: string
  $colored?: boolean
}>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  border-radius: 6px;
  margin-bottom: 6px;
  transition: all 0.25s ease;

  ${({ completed }) =>
    completed &&
    `
      color: var(--sn-stylekit-foreground-color);
      opacity: 0.7;
    `}

  ${({ $colored, priority }) =>
    $colored
      ? (() => {
          switch (priority) {
            case 'high':
              return 'border-left: 3px solid #ff453a;'
            case 'medium':
              return 'border-left: 3px solid #ff9f0a;'
            case 'low':
              return 'border-left: 3px solid #30d158;'
            default:
              return 'border-left: 3px solid transparent;'
          }
        })()
      : 'border-left: 3px solid transparent;'}

  /* dezenter Zeilenhintergrund (Light) */
  background: rgba(0, 0, 0, 0.04);

  /* und im Dark minimal hell */
  [data-theme='dark'] & {
    background: rgba(255, 255, 255, 0.03);
  }

  color: var(--sn-stylekit-foreground-color);
`

export type TaskItemProps = {
  task: TaskPayload
  groupName: string
  innerRef?: (element?: HTMLElement | null) => any
}

const TaskItem: React.FC<TaskItemProps> = ({ task, groupName, innerRef }) => {
  const textAreaRef = createRef<HTMLTextAreaElement>()
  const dispatch = useAppDispatch()
  const canEdit = useAppSelector((state) => state.settings.canEdit)
  const spellCheckEnabled = useAppSelector(
    (state) => state.settings.spellCheckerEnabled
  )
  const prioritiesEnabled = useAppSelector((s) => s.tasks.prioritiesEnabled)

  const [completed, setCompleted] = useState(!!task.completed)
  const [description, setDescription] = useState(task.description)

  function resizeTextArea(textarea: HTMLTextAreaElement | null): void {
    if (!textarea) return
    textarea.style.height = '1px'
    textarea.style.height = textarea.scrollHeight - 4 + 'px'
  }

  useEffect(() => {
    resizeTextArea(textAreaRef.current)
  })

  function onCheckBoxToggle() {
    const newState = !completed
    setCompleted(newState)
    const delay = newState
      ? DISPATCH_COMPLETED_DELAY_MS
      : DISPATCH_OPENED_DELAY_MS
    setTimeout(() => {
      dispatch(taskToggled({ id: task.id, groupName }))
    }, delay)
  }

  function onTextChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setDescription(event.target.value)
  }

  function onKeyUp(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter') {
      if (description.length === 0) {
        dispatch(taskDeleted({ id: task.id, groupName }))
        event.preventDefault()
      }
    }
    resizeTextArea(event.target as HTMLTextAreaElement)
  }

  function onKeyPress(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter') event.preventDefault()
  }

  useDidMount(() => {
    const timeoutId = setTimeout(() => {
      if (description !== task.description) {
        dispatch(
          taskModified({ task: { id: task.id, description }, groupName })
        )
      }
    }, 500)
    return () => clearTimeout(timeoutId)
  }, [description, groupName])

  return (
    <Container
      data-testid="task-item"
      completed={completed}
      priority={task.priority}
      $colored={prioritiesEnabled}
      ref={innerRef}
    >
      {/* Checkbox/Häkchen */}
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          cursor: canEdit ? 'pointer' : 'default',
          gap: 6,
          minWidth: 18,
        }}
        title={
          completed ? 'Als unerledigt markieren' : 'Als erledigt markieren'
        }
      >
        {/* das eigentliche Input bleibt – ist aber unsichtbar, damit beim „✓ only“ der Klick trotzdem funktioniert */}
        <input
          type="checkbox"
          checked={completed}
          disabled={!canEdit}
          onChange={onCheckBoxToggle}
          style={{
            position: 'absolute',
            opacity: 0,
            pointerEvents: 'none',
            width: 0,
            height: 0,
          }}
        />

        {!completed ? (
          // 11x11px Quadrat, dünne Linie, leicht gerundet
          <span
            aria-hidden="true"
            style={{
              width: 11,
              height: 11,
              borderRadius: 2,
              border: '1px solid currentColor',
              display: 'inline-block',
              boxSizing: 'border-box',
            }}
          />
        ) : (
          // lila Häkchen als Ersatz (kein Kästchen)
          <span
            aria-hidden="true"
            style={{
              fontSize: 16,
              lineHeight: 1,
              color: '#9836faff',
              marginLeft: 1,
              display: 'inline-block',
            }}
          >
            ✔
          </span>
        )}
      </label>

      <TextAreaInput
        testId="text-area-input"
        disabled={!canEdit}
        onChange={onTextChange}
        onKeyPress={onKeyPress}
        onKeyUp={onKeyUp}
        ref={textAreaRef}
        spellCheck={spellCheckEnabled}
        value={description}
        // @ts-ignore
        style={{
          background: 'transparent',
          border: 'none',
          color: completed ? '#b366ff' : 'var(--sn-stylekit-foreground-color)',
          textDecoration: completed ? 'line-through' : 'none',
          flexGrow: 1,
          resize: 'none',
          fontSize: '14px',
          padding: '2px 6px',
          transition: 'color 0.2s ease, text-decoration 0.2s ease',
        }}
      />

      {/* 🔘 Priorität rechts (nur wenn Prioritäten aktiv) */}
      {prioritiesEnabled && (
        <button
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: 16,
            marginLeft: 8,
            opacity: 0.85,
            transition: 'opacity 0.2s ease, transform 0.2s ease',
          }}
          onClick={() => {
            const priorities: Priority[] = ['none', 'low', 'medium', 'high']
            const next =
              priorities[
                (priorities.indexOf(task.priority || 'none') + 1) %
                  priorities.length
              ]
            dispatch(
              taskModified({ task: { ...task, priority: next }, groupName })
            )
          }}
          title="Priorität ändern"
        >
          {task.priority === 'none' && '⚪'}
          {task.priority === 'low' && '🟢'}
          {task.priority === 'medium' && '🟠'}
          {task.priority === 'high' && '🔴'}
        </button>
      )}
    </Container>
  )
}

export default TaskItem
