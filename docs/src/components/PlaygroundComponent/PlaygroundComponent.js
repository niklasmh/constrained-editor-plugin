import React, { useState } from 'react';
import clsx from 'clsx';
import styles from './PlaygroundComponent.module.css';
import * as monaco from 'monaco-editor';
import constrainedEditor from 'constrained-editor-plugin';

export default class PlaygroundComponent extends React.Component {
  constructor(props) {
    super(props);
    this.monacoContainer = React.createRef();
    this.values = {};
  }
  componentWillMount() {
    const baseDir = '/node_modules/monaco-editor/esm/vs/';
    window.MonacoEnvironment = {
      getWorkerUrl: function (_moduleId, label) {
        if (label === 'json') {
          return baseDir + 'language/json/json.worker.js';
        }
        if (label === 'css' || label === 'scss' || label === 'less') {
          return baseDir + 'language/css/css.worker.js';
        }
        if (label === 'html' || label === 'handlebars' || label === 'razor') {
          return baseDir + 'language/html/html.worker.js';
        }
        if (label === 'typescript' || label === 'javascript') {
          return baseDir + 'language/typescript/ts.worker.js';
        }
        return baseDir + 'editor/editor.worker.js';
      }
    };
  }
  componentDidMount() {
    this.editorInstance = monaco.editor.create(this.monacoContainer.current, {
      value: [
        'const utils = {};',
        'function addKeysToUtils(){',
        '',
        '}',
        'addKeysToUtils();'
      ].join('\n'),
      language: 'javascript'
    });
    const constrainedInstance = constrainedEditor(monaco);
    constrainedInstance.initializeIn(this.editorInstance);
    this.model = this.editorInstance.getModel();
    this.model = constrainedInstance.addRestrictionsTo(this.model, [
      {
        range: [1, 7, 1, 12], // Range of Util Variable name
        label: 'utilName',
        validate: function (currentlyTypedValue, newRange, info) {
          // console.log({ currentlyTypedValue });
          const noSpaceAndSpecialChars = /^[a-z0-9A-Z]*$/;
          return noSpaceAndSpecialChars.test(currentlyTypedValue);
        }
      },
      {
        range: [3, 1, 3, 1], // Range of Function definition
        allowMultiline: true,
        label: 'funcDefinition'
      }
    ]);
    this.model.onDidChangeContentInEditableRange(function () {
      debugger
    })
  }

  showEditableArea() {
    this.model.toggleHighlightOfEditableAreas();
  }

  render() {
    return (
      <section className={styles.section}>
        <h1>Playground</h1>
        <div className={styles.container}>
          <div ref={this.monacoContainer} className={clsx('monaco', styles.editor)}>
          </div>
          <div className={styles.switches}>
            <h2>Toolkit</h2>
            <div className={styles.highlightAreas}>
              <label>Highlight Editable Areas</label>
              <input type="checkbox" onClick={() => this.showEditableArea.call(this)} />
            </div>
            <div>
              <label>Current Values</label>
              <div className={styles.currentValues}>
                {/* {Object.keys(this.values).map(label => (
                  <div>
                    <div>{label}</div>
                    <div>{this.values[label]}</div>
                  </div>
                ))} */}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }
}