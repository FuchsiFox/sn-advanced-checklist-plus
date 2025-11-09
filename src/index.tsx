import './stylesheets/main.scss'

import React, { useCallback, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
import { renderToString } from 'react-dom/server'
import { Provider } from 'react-redux'
import EditorKit, { EditorKitDelegate } from '@standardnotes/editor-kit'
import styled from 'styled-components'

import { store } from './app/store'
import { useAppDispatch, useAppSelector } from './app/hooks'
import CreateGroup from './features/tasks/CreateGroup'
import {
  setCanEdit,
  setIsRunningOnMobile,
  setSpellCheckerEnabled,
} from './features/settings/settings-slice'
import { tasksLoaded } from './features/tasks/tasks-slice'
import InvalidContentError from './features/tasks/InvalidContentError'
import MigrateLegacyContent from './features/tasks/MigrateLegacyContent'
import NotePreview from './features/tasks/NotePreview'
import TaskGroupList from './features/tasks/TaskGroupList'

import { getPlainPreview } from './common/utils'
import { CheckBoxElementsDefs } from './common/components/svg'

declare global {
  interface Window {
    note?: any
  }
}


const MainContainer = styled.div`
  margin: 16px;
  padding-bottom: 60px;
`

const FloatingContainer = styled.div`
  background-color: var(--sn-stylekit-secondary-background-color);
  border-top: 1px solid var(--sn-stylekit-border-color);
  bottom: 0;
  display: flex;
  position: fixed;
  width: 100%;
`

const CenteredContainer = styled.div`
  display: flex;
  justify-content: center;
  margin: 0px;
  padding: 12px 16px;
  position: relative;
  width: 98%;
`

const TaskEditor: React.FC = () => {
  const note = useRef<any>()
  const editorKit = useRef<EditorKit>()

  const initialized = useAppSelector((state) => state.tasks.initialized)
  const groupedTasks = useAppSelector((state) => state.tasks.groups)
  const legacyContent = useAppSelector((state) => state.tasks.legacyContent)

  const dispatch = useAppDispatch()

  function isRunningOnMobile(): boolean {
    return editorKit.current!.isRunningInMobileApplication()
  }

  const configureEditorKit = useCallback(() => {
    const editorKitDelegate: EditorKitDelegate = {
      setEditorRawText: (rawString: string) => {
        dispatch(tasksLoaded(rawString))
      },
      onNoteValueChange: async (currentNote: any) => {
        note.current = currentNote
        ;(window as any).note = currentNote

        window.note = currentNote // <--- hinzufügen, um Zugriff aus anderen Komponenten zu erlauben


        const editable =
          !(currentNote?.content?.appData?.['org.standardnotes.sn']?.locked ?? false)
        const spellCheckEnabled = currentNote.content.spellcheck

        dispatch(setCanEdit(editable))
        dispatch(setSpellCheckerEnabled(spellCheckEnabled))
        dispatch(setIsRunningOnMobile(isRunningOnMobile()))
      },
      onNoteLockToggle: (locked: boolean) => {
        dispatch(setCanEdit(!locked))
      },
    }

    editorKit.current = new EditorKit(editorKitDelegate, {
      mode: 'json',
      supportsFileSafe: false,
    })

    
    ;(window as any).editorKit = editorKit.current

  }, [dispatch])

  useEffect(() => {
    configureEditorKit()
  }, [configureEditorKit])

  const saveNote = useCallback(() => {
  const { initialized } = store.getState().tasks
  const currentNote = note.current
  if (!currentNote || !initialized) return

  const canEdit = store.getState().settings.canEdit
  if (!canEdit) return

  editorKit.current!.saveItemWithPresave(currentNote, () => {
    // 👇 NUR über store.getState() lesen – keine Hooks hier!
    const {
      schemaVersion,
      groups,
      priorityFilter,
      prioritiesEnabled,
      theme, // falls bereits im Slice vorhanden
    } = store.getState().tasks

    // Textinhalt speichern (inkl. Prioritäten/Filter/Theme, damit es persistiert)
    currentNote.content.text = JSON.stringify(
      {
        schemaVersion,
        groups,
        prioritiesEnabled,
        priorityFilter,
        theme, // falls vorhanden
      },
      null,
      2
    )

    // Previews aktualisieren
    currentNote.content.preview_plain = getPlainPreview(groups)
    currentNote.content.preview_html = renderToString(
      <NotePreview groupedTasks={groups} />
    )
  })
}, [])


  useEffect(() => {
    const unsubscribe = store.subscribe(() => initialized && saveNote())
    return unsubscribe
  })

  /**
   * Prevents dragging and dropping files
   */
  useEffect(() => {
    function rejectDragAndDrop(event: DragEvent) {
      event && event.preventDefault()
    }

    window.addEventListener('drop', rejectDragAndDrop)
    window.addEventListener('dragover', rejectDragAndDrop)

    return () => {
      window.removeEventListener('drop', rejectDragAndDrop)
      window.removeEventListener('dragover', rejectDragAndDrop)
    }
  }, [])

  if (legacyContent) {
    return (
      <MainContainer>
        <MigrateLegacyContent />
      </MainContainer>
    )
  }

  if (!initialized) {
    return (
      <MainContainer>
        <InvalidContentError />
      </MainContainer>
    )
  }

  if (groupedTasks.length === 0) {
    return (
      <MainContainer>
        <CreateGroup />
      </MainContainer>
    )
  }

  return (
    <>
      <CheckBoxElementsDefs />
      <MainContainer>
        <TaskGroupList />
      </MainContainer>
      <FloatingContainer>
        <CenteredContainer>
          <CreateGroup />
        </CenteredContainer>
      </FloatingContainer>
    </>
  )
}

ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <TaskEditor />
    </Provider>
  </React.StrictMode>,
  document.getElementById('root')
)
