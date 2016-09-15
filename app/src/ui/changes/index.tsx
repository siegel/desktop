import * as React from 'react'
import { ChangesList } from './changes-list'
import FileDiff from '../file-diff'
import { IChangesState, PopupType } from '../../lib/app-state'
import Repository from '../../models/repository'
import { Dispatcher, IGitHubUser } from '../../lib/dispatcher'
import { Resizable } from '../resizable'

interface IChangesProps {
  readonly repository: Repository
  readonly changes: IChangesState
  readonly dispatcher: Dispatcher
  readonly committerEmail: string | null
  readonly branch: string | null
  readonly gitHubUsers: Map<string, IGitHubUser>
  readonly emoji: Map<string, string>
}

/** TODO: handle "repository not found" scenario */

export class Changes extends React.Component<IChangesProps, void> {
  private onCreateCommit(summary: string, description: string) {
    this.props.dispatcher.commitIncludedChanges(this.props.repository, summary, description)
  }

  private onRowSelected(row: number) {
    const file = this.props.changes.workingDirectory.files[row]
    this.props.dispatcher.changeChangesSelection(this.props.repository, file)
  }

  private onIncludeChanged(row: number, include: boolean) {
    const workingDirectory = this.props.changes.workingDirectory
    const file = workingDirectory.files[row]
    if (!file) {
      console.error('unable to find working directory path to apply included change: ' + row)
      return
    }

    this.props.dispatcher.changeFileIncluded(this.props.repository, file, include)
  }

  private onSelectAll(selectAll: boolean) {
    this.props.dispatcher.changeIncludeAllFiles(this.props.repository, selectAll)
  }

  private onDiffLineIncludeChanged(diffSelection: Map<number, boolean>) {
    const file = this.props.changes.selectedFile
    if (!file) {
      console.error('diff line selection changed despite no file error - what?')
      return
    }

    this.props.dispatcher.changeFileLineSelection(this.props.repository, file, diffSelection)
  }

  private onDiscardChanges(row: number) {
    const workingDirectory = this.props.changes.workingDirectory
    const file = workingDirectory.files[row]
    this.props.dispatcher.showPopup({
      type: PopupType.ConfirmDiscardChanges,
      repository: this.props.repository,
      files: [ file ],
    })
  }

  public render() {
    const selectedPath = this.props.changes.selectedFile ? this.props.changes.selectedFile!.path : null

    const email = this.props.committerEmail
    let user: IGitHubUser | null = null
    if (email) {
      user = this.props.gitHubUsers.get(email.toLowerCase()) || null
    }

    const avatarURL = user ? user.avatarURL : 'https://github.com/hubot.png'
    return (
      <div className='panel-container'>
        <Resizable configKey='changes-width'>
          <ChangesList repository={this.props.repository}
                       workingDirectory={this.props.changes.workingDirectory}
                       selectedPath={selectedPath}
                       onRowSelected={event => this.onRowSelected(event)}
                       onCreateCommit={(summary, description) => this.onCreateCommit(summary, description)}
                       onIncludeChanged={(row, include) => this.onIncludeChanged(row, include)}
                       onSelectAll={selectAll => this.onSelectAll(selectAll)}
                       onDiscardChanges={row => this.onDiscardChanges(row)}
                       branch={this.props.branch}
                       avatarURL={avatarURL}
                       emoji={this.props.emoji}/>
        </Resizable>

        <FileDiff repository={this.props.repository}
                  file={this.props.changes.selectedFile}
                  readOnly={false}
                  commit={null}
                  onIncludeChanged={(diffSelection) => this.onDiffLineIncludeChanged(diffSelection)} />
      </div>
    )
  }
}
