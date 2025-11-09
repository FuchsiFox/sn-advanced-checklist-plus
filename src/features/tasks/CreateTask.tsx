import { ChangeEvent, createRef, KeyboardEvent, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import styled from 'styled-components'

import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { GroupPayload, taskAdded, tasksGroupDraft } from './tasks-slice'

import { isLastActiveGroup } from '../../common/utils'

const Container = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  width: 100%;
`

/* Volle Breite + Theme per data-theme */
const StyledInput = styled.input`
  width: 100%;
  box-sizing: border-box;
  padding: 8px 10px;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  border: 1px solid var(--sn-stylekit-border-color);
  color: var(--sn-stylekit-foreground-color);
  background: #ffffff; /* Default: Light */

  /* Light explizit hell */
  :root[data-theme='light'] & {
    background: #ffffff;
  }

  /* Dark deutlich dunkel */
  :root[data-theme='dark'] & {
    background: var(--sn-stylekit-contrast-background-color);
  }

  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:focus {
    border-color: #b486f9;
    box-shadow: 0 0 6px rgba(180, 134, 249, 0.6);
  }

  &::placeholder {
    color: rgba(127, 127, 127, 0.9);
  }
`

type CreateTaskProps = {
  group: GroupPayload
}

const CreateTask: React.FC<CreateTaskProps> = ({ group }) => {
  const inputRef = createRef<HTMLInputElement>()
  const dispatch = useAppDispatch()

  const spellCheckerEnabled = useAppSelector(
    (state) => state.settings.spellCheckerEnabled
  )
  const canEdit = useAppSelector((state) => state.settings.canEdit)
  const allGroups = useAppSelector((state) => state.tasks.groups)

  const groupName = group.name
  const [taskDraft, setTaskDraft] = useState<string>(group.draft ?? '')

  function onTextChange(event: ChangeEvent<HTMLInputElement>) {
    const draft = event.target.value
    dispatch(tasksGroupDraft({ groupName, draft }))
    setTaskDraft(draft)
  }

  function handleKeyPress(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      const rawString = (event.target as HTMLInputElement).value.trim()
      if (!rawString) return

      dispatch(
        taskAdded({ task: { id: uuidv4(), description: rawString }, groupName })
      )
      setTaskDraft('')
    }
  }

  if (!canEdit) return null

  const isLastActive = isLastActiveGroup(allGroups, groupName)

  return (
    <Container>
      <StyledInput
        ref={inputRef}
        value={taskDraft}
        onChange={onTextChange}
        onKeyPress={handleKeyPress}
        placeholder="enter new task..."
        spellCheck={spellCheckerEnabled}
        autoFocus={isLastActive}
      />
    </Container>
  )
}

export default CreateTask
