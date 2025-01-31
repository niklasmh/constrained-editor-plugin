//! Tests should not be run in random order.
const stringifyRange = function (range) {
  return `[${range.startLineNumber},${range.startColumn} -> ${range.endLineNumber},${range.endColumn}]`;
}
describe('Restrict Edit Area', function () {
  var editorInstance, model, instanceOfConstrainedEditor, monacoInstance, domNode;
  beforeAll(function (done) {
    require.config({ paths: { vs: '../node_modules/monaco-editor/min/vs' } });
    require(['vs/editor/editor.main'], function () {
      monacoInstance = monaco;
      editorInstance = monaco.editor.create(document.getElementById('container'), {
        value: [
          'function sample () {',
          '  console.log("Hello world!");',
          '  // Type something here',
          '}',
        ].join('\n'),
        language: 'javascript'
      });
      model = editorInstance.getModel();
      /**
       * Configuration for the Restricted Editor : Starts Here
       */
      instanceOfConstrainedEditor = constrainedEditor(monaco);
      instanceOfConstrainedEditor.initializeIn(editorInstance);
      instanceOfConstrainedEditor.addRestrictionsTo(model, [
        /**
         * range : [ startLine, startColumn, endLine, endColumn ]
        */
        {
          range: [2, 16, 2, 28], // Range of Hello world! String
          label: 'valueInConsoleLog'
        }, {
          range: [1, 18, 1, 18], // Range of Arguments for Sample Function
          label: 'argsOfSampleFn'
        }, {
          range: [3, 1, 3, 25], // Range of // Type something here
          label: 'contentOfSampleFn',
          allowMultiline: true
        }
      ]);
      domNode = editorInstance.getDomNode();
      domNode.addEventListener('mousedown', function () {
        console.log(editorInstance.getPosition());
      })
      done();
    });
  })
  describe('API Check', function () {
    const listOfAPIsInInstance = [
      'initializeIn',
      'addRestrictionsTo',
      'removeRestrictionsIn',
      'disposeConstrainer'
    ]
    listOfAPIsInInstance.forEach(function (api) {
      it('Does instance has : ' + api, function () {
        expect(instanceOfConstrainedEditor[api]).toBeDefined();
      })
    })
    const listOfAPIsInNewModel = [
      'editInRestrictedArea',
      'getCurrentEditableRanges',
      'getValueInEditableRanges',
      'disposeRestrictions',
      'onDidChangeContentInEditableRange',
      'updateRestrictions'
    ]
    listOfAPIsInNewModel.forEach(function (api) {
      it('Does restricted model has : ' + api, function () {
        expect(model[api]).toBeDefined();
      })
    })
  })
  describe('Base Case Check', function () {
    it('Check whether ranges return proper value initially', function () {
      const expected = {
        valueInConsoleLog: 'Hello world!',
        argsOfSampleFn: '',
        contentOfSampleFn: '  // Type something here'
      }
      expect(expected).toEqual(model.getValueInEditableRanges());
    })
  })
  describe('Updating Value', function () {
    describe('Add Value in Single Line Range', function () {
      describe('Single Line Change', function () {
        let model, defaultValue, changeText = 'ABC';
        beforeEach(function () {
          defaultValue = [
            '123'
          ].join('\n');
          model = monaco.editor.createModel(defaultValue, 'javascript');
          instanceOfConstrainedEditor.addRestrictionsTo(model, [
            {
              range: [1, 1, 1, 4],
              label: 'test'
            }
          ]);
          editorInstance.setModel(model);
        })
        it('Start Of Range', function () {
          domNode.dispatchEvent(new Event('keydown'))
          model.applyEdits([{
            forceMoveMarkers: true,
            range: new monaco.Range(1, 1, 1, 1),
            text: changeText
          }])
          expect(model.getValue()).toEqual(changeText + defaultValue);
          const currentRanges = model.getCurrentEditableRanges();
          expect(stringifyRange(currentRanges.test.range)).toBe(model.getFullModelRange().toString());
        })
        it('Mid Of Range', function () {
          domNode.dispatchEvent(new Event('keydown'))
          model.applyEdits([{
            forceMoveMarkers: true,
            range: new monaco.Range(1, 2, 1, 2),
            text: changeText
          }])
          expect(model.getValue()).toEqual('1ABC23');
          const currentRanges = model.getCurrentEditableRanges();
          expect(stringifyRange(currentRanges.test.range)).toBe(model.getFullModelRange().toString());
        })
        it('End Of Range', function () {
          domNode.dispatchEvent(new Event('keydown'))
          model.applyEdits([{
            forceMoveMarkers: true,
            range: new monaco.Range(1, 4, 1, 4),
            text: 'ABC'
          }])
          expect(model.getValue()).toEqual(defaultValue + changeText);
          const currentRanges = model.getCurrentEditableRanges();
          expect(stringifyRange(currentRanges.test.range)).toBe(model.getFullModelRange().toString());
        })
      })
      describe('Multi Line Change', function () {
        let model, defaultValue, changeText = 'ABC\nDEF';
        beforeEach(function () {
          defaultValue = [
            '123'
          ].join('\n');
          model = monaco.editor.createModel(defaultValue, 'javascript');
          instanceOfConstrainedEditor.addRestrictionsTo(model, [
            {
              range: [1, 1, 1, 4],
              label: 'test',
              allowMultiline: true
            }
          ]);
          editorInstance.setModel(model);
        })
        it('Start Of Range', function () {
          domNode.dispatchEvent(new Event('keydown'))
          model.applyEdits([{
            forceMoveMarkers: true,
            range: new monaco.Range(1, 1, 1, 1),
            text: changeText
          }])
          expect(model.getValue()).toEqual(changeText + '123');
          const currentRanges = model.getCurrentEditableRanges();
          expect(stringifyRange(currentRanges.test.range)).toBe(model.getFullModelRange().toString());
        })
        it('Mid Of Range - 1', function () {
          domNode.dispatchEvent(new Event('keydown'))
          model.applyEdits([{
            forceMoveMarkers: true,
            range: new monaco.Range(1, 2, 1, 2),
            text: changeText
          }])
          expect(model.getValue()).toEqual('1' + changeText + '23');
          const currentRanges = model.getCurrentEditableRanges();
          expect(stringifyRange(currentRanges.test.range)).toBe(model.getFullModelRange().toString());
        })
        it('Mid Of Range - 2', function () {
          domNode.dispatchEvent(new Event('keydown'))
          model.applyEdits([{
            forceMoveMarkers: true,
            range: new monaco.Range(1, 3, 1, 3),
            text: changeText
          }])
          expect(model.getValue()).toEqual('12' + changeText + '3');
          const currentRanges = model.getCurrentEditableRanges();
          expect(stringifyRange(currentRanges.test.range)).toBe(model.getFullModelRange().toString());
        })
        it('End Of Range', function () {
          domNode.dispatchEvent(new Event('keydown'))
          model.applyEdits([{
            forceMoveMarkers: true,
            range: new monaco.Range(1, 4, 1, 4),
            text: changeText
          }])
          expect(model.getValue()).toEqual('123' + changeText);
          const currentRanges = model.getCurrentEditableRanges();
          expect(stringifyRange(currentRanges.test.range)).toBe(model.getFullModelRange().toString());
        })
      })
    })
    describe('Add Value in Multi Line Range', function () {
      describe('Single Line Change', function () {
        let model, defaultValue, changeText = 'ABC';
        beforeEach(function () {
          defaultValue = [
            '123',
            '456'
          ].join('\n');
          model = monaco.editor.createModel(defaultValue, 'javascript');
          instanceOfConstrainedEditor.addRestrictionsTo(model, [
            {
              range: [1, 1, 2, 4],
              label: 'test'
            }
          ]);
          editorInstance.setModel(model);
        })
        it('Start Of Range', function () {
          domNode.dispatchEvent(new Event('keydown'))
          model.applyEdits([{
            forceMoveMarkers: true,
            range: new monaco.Range(1, 1, 1, 1),
            text: changeText
          }])
          expect(model.getValue()).toEqual(changeText + defaultValue);
          const currentRanges = model.getCurrentEditableRanges();
          expect(stringifyRange(currentRanges.test.range)).toBe(model.getFullModelRange().toString());
        })
        it('Mid Of Range - 1', function () {
          domNode.dispatchEvent(new Event('keydown'))
          model.applyEdits([{
            forceMoveMarkers: true,
            range: new monaco.Range(1, 3, 1, 3),
            text: changeText
          }])
          expect(model.getValue()).toEqual('12ABC3\n456');
          const currentRanges = model.getCurrentEditableRanges();
          expect(stringifyRange(currentRanges.test.range)).toBe(model.getFullModelRange().toString());
        })
        it('Mid Of Range - 2', function () {
          domNode.dispatchEvent(new Event('keydown'))
          model.applyEdits([{
            forceMoveMarkers: true,
            range: new monaco.Range(2, 2, 2, 2),
            text: changeText
          }])
          expect(model.getValue()).toEqual('123\n4ABC56');
          const currentRanges = model.getCurrentEditableRanges();
          expect(stringifyRange(currentRanges.test.range)).toBe(model.getFullModelRange().toString());
        })
        it('End Of Range', function () {
          domNode.dispatchEvent(new Event('keydown'))
          model.applyEdits([{
            forceMoveMarkers: true,
            range: new monaco.Range(2, 4, 2, 4),
            text: changeText
          }])
          expect(model.getValue()).toEqual(defaultValue + changeText);
          const currentRanges = model.getCurrentEditableRanges();
          expect(stringifyRange(currentRanges.test.range)).toBe(model.getFullModelRange().toString());
        })
      })
      describe('Multi Line Change', function () {
        let model, defaultValue, changeText = 'ABC\nDEF';
        beforeEach(function () {
          defaultValue = [
            '123',
            '456'
          ].join('\n');
          model = monaco.editor.createModel(defaultValue, 'javascript');
          instanceOfConstrainedEditor.addRestrictionsTo(model, [
            {
              range: [1, 1, 2, 4],
              label: 'test',
              allowMultiline: true
            }
          ]);
          editorInstance.setModel(model);
        })
        it('Start Of Range', function () {
          domNode.dispatchEvent(new Event('keydown'))
          model.applyEdits([{
            forceMoveMarkers: true,
            range: new monaco.Range(1, 1, 1, 1),
            text: changeText
          }])
          expect(model.getValue()).toEqual(changeText + defaultValue);
          const currentRanges = model.getCurrentEditableRanges();
          expect(stringifyRange(currentRanges.test.range)).toBe(model.getFullModelRange().toString());
        })
        it('Mid Of Range - 1', function () {
          domNode.dispatchEvent(new Event('keydown'))
          model.applyEdits([{
            forceMoveMarkers: true,
            range: new monaco.Range(1, 2, 1, 2),
            text: changeText
          }])
          expect(model.getValue()).toEqual('1' + changeText + '23\n456');
          const currentRanges = model.getCurrentEditableRanges();
          expect(stringifyRange(currentRanges.test.range)).toBe(model.getFullModelRange().toString());
        })
        it('Mid Of Range - 2', function () {
          domNode.dispatchEvent(new Event('keydown'))
          model.applyEdits([{
            forceMoveMarkers: true,
            range: new monaco.Range(2, 3, 2, 3),
            text: changeText
          }])
          expect(model.getValue()).toEqual('123\n45' + changeText + '6');
          const currentRanges = model.getCurrentEditableRanges();
          expect(stringifyRange(currentRanges.test.range)).toBe(model.getFullModelRange().toString());
        })
        it('End Of Range', function () {
          domNode.dispatchEvent(new Event('keydown'))
          model.applyEdits([{
            forceMoveMarkers: true,
            range: new monaco.Range(2, 4, 2, 4),
            text: changeText
          }])
          expect(model.getValue()).toEqual('123\n456' + changeText);
          const currentRanges = model.getCurrentEditableRanges();
          expect(stringifyRange(currentRanges.test.range)).toBe(model.getFullModelRange().toString());
        })
      })
    })
    describe('Delete Value in Single Line Range', function () {
      let model, defaultValue, changeText = '';
      beforeEach(function () {
        defaultValue = [
          '123456'
        ].join('\n');
        model = monaco.editor.createModel(defaultValue, 'javascript');
        instanceOfConstrainedEditor.addRestrictionsTo(model, [
          {
            range: [1, 1, 1, 7],
            label: 'test'
          }
        ]);
        editorInstance.setModel(model);
      })
      it('Start Of Range', function () {
        domNode.dispatchEvent(new Event('keydown'))
        model.applyEdits([{
          forceMoveMarkers: true,
          range: new monaco.Range(1, 1, 1, 4),
          text: changeText
        }])
        expect(model.getValue()).toEqual('456');
        const currentRanges = model.getCurrentEditableRanges();
        expect(stringifyRange(currentRanges.test.range)).toBe(model.getFullModelRange().toString());
      })
      it('Mid Of Range', function () {
        domNode.dispatchEvent(new Event('keydown'))
        model.applyEdits([{
          forceMoveMarkers: true,
          range: new monaco.Range(1, 2, 1, 5),
          text: changeText
        }])
        expect(model.getValue()).toEqual('156');
        const currentRanges = model.getCurrentEditableRanges();
        expect(stringifyRange(currentRanges.test.range)).toBe(model.getFullModelRange().toString());
      })
      it('End Of Range', function () {
        domNode.dispatchEvent(new Event('keydown'))
        model.applyEdits([{
          forceMoveMarkers: true,
          range: new monaco.Range(1, 5, 1, 7),
          text: changeText
        }])
        expect(model.getValue()).toEqual('1234');
        const currentRanges = model.getCurrentEditableRanges();
        expect(stringifyRange(currentRanges.test.range)).toBe(model.getFullModelRange().toString());
      })
    })
    describe('Delete Value in Multi Line Range', function () {
      let model, defaultValue, changeText = '';
      beforeEach(function () {
        defaultValue = [
          '123',
          '456',
          '789'
        ].join('\n');
        model = monaco.editor.createModel(defaultValue, 'javascript');
        instanceOfConstrainedEditor.addRestrictionsTo(model, [
          {
            range: [1, 1, 3, 4],
            allowMultiline: true,
            label: 'test'
          }
        ]);
        editorInstance.setModel(model);
      })
      it('Start Of Range', function () {
        domNode.dispatchEvent(new Event('keydown'))
        model.applyEdits([{
          forceMoveMarkers: true,
          range: new monaco.Range(1, 1, 2, 1),
          text: changeText
        }])
        expect(model.getValue()).toEqual('456\n789');
        const currentRanges = model.getCurrentEditableRanges();
        expect(stringifyRange(currentRanges.test.range)).toBe(model.getFullModelRange().toString());
      })
      it('Mid Of Range - 1', function () {
        domNode.dispatchEvent(new Event('keydown'))
        model.applyEdits([{
          forceMoveMarkers: true,
          range: new monaco.Range(1, 2, 2, 2),
          text: changeText
        }])
        expect(model.getValue()).toEqual('156\n789');
        const currentRanges = model.getCurrentEditableRanges();
        expect(stringifyRange(currentRanges.test.range)).toBe(model.getFullModelRange().toString());
      })
      it('Mid Of Range - 2', function () {
        domNode.dispatchEvent(new Event('keydown'))
        model.applyEdits([{
          forceMoveMarkers: true,
          range: new monaco.Range(2, 1, 2, 4),
          text: changeText
        }])
        expect(model.getValue()).toEqual('123\n\n789');
        const currentRanges = model.getCurrentEditableRanges();
        expect(stringifyRange(currentRanges.test.range)).toBe(model.getFullModelRange().toString());
      })
      it('Mid Of Range - 3', function () {
        domNode.dispatchEvent(new Event('keydown'))
        model.applyEdits([{
          forceMoveMarkers: true,
          range: new monaco.Range(1, 2, 3, 3),
          text: changeText
        }])
        expect(model.getValue()).toEqual('19');
        const currentRanges = model.getCurrentEditableRanges();
        expect(stringifyRange(currentRanges.test.range)).toBe(model.getFullModelRange().toString());
      })
      it('End Of Range', function () {
        domNode.dispatchEvent(new Event('keydown'))
        model.applyEdits([{
          forceMoveMarkers: true,
          range: new monaco.Range(2, 1, 2, 2),
          text: changeText
        }])
        expect(model.getValue()).toEqual('123\n56\n789');
        const currentRanges = model.getCurrentEditableRanges();
        expect(stringifyRange(currentRanges.test.range)).toBe(model.getFullModelRange().toString());
      })
    })
    describe('Replace Value in Single Line Range', function () {
      let model, defaultValue, changeText = 'ABC';
      beforeEach(function () {
        defaultValue = [
          '123456'
        ].join('\n');
        model = monaco.editor.createModel(defaultValue, 'javascript');
        instanceOfConstrainedEditor.addRestrictionsTo(model, [
          {
            range: [1, 1, 1, 7],
            label: 'test'
          }
        ]);
        editorInstance.setModel(model);
      })
      it('Start Of Range', function () {
        domNode.dispatchEvent(new Event('keydown'))
        model.applyEdits([{
          forceMoveMarkers: true,
          range: new monaco.Range(1, 1, 1, 4),
          text: changeText
        }])
        expect(model.getValue()).toEqual('ABC456');
        const currentRanges = model.getCurrentEditableRanges();
        expect(stringifyRange(currentRanges.test.range)).toBe(model.getFullModelRange().toString());
      })
      it('Mid Of Range', function () {
        domNode.dispatchEvent(new Event('keydown'))
        model.applyEdits([{
          forceMoveMarkers: true,
          range: new monaco.Range(1, 2, 1, 5),
          text: changeText
        }])
        expect(model.getValue()).toEqual('1ABC56');
        const currentRanges = model.getCurrentEditableRanges();
        expect(stringifyRange(currentRanges.test.range)).toBe(model.getFullModelRange().toString());
      })
      it('End Of Range', function () {
        domNode.dispatchEvent(new Event('keydown'))
        model.applyEdits([{
          forceMoveMarkers: true,
          range: new monaco.Range(1, 5, 1, 7),
          text: changeText
        }])
        expect(model.getValue()).toEqual('1234ABC');
        const currentRanges = model.getCurrentEditableRanges();
        expect(stringifyRange(currentRanges.test.range)).toBe(model.getFullModelRange().toString());
      })
    })
    describe('Replace Value in Multi Line Range', function () {
      describe('Single Line Change', function () {
        let model, defaultValue, changeText = 'ABCDEF';
        beforeEach(function () {
          defaultValue = [
            '123',
            '456',
            '789'
          ].join('\n');
          model = monaco.editor.createModel(defaultValue, 'javascript');
          instanceOfConstrainedEditor.addRestrictionsTo(model, [
            {
              range: [1, 1, 3, 4],
              allowMultiline: true,
              label: 'test'
            }
          ]);
          editorInstance.setModel(model);
        })
        it('Start Of Range', function () {
          domNode.dispatchEvent(new Event('keydown'))
          model.applyEdits([{
            forceMoveMarkers: true,
            range: new monaco.Range(1, 1, 2, 1),
            text: changeText
          }])
          expect(model.getValue()).toEqual('ABCDEF456\n789');
          const currentRanges = model.getCurrentEditableRanges();
          expect(stringifyRange(currentRanges.test.range)).toBe(model.getFullModelRange().toString());
        })
        it('Mid Of Range - 1', function () {
          domNode.dispatchEvent(new Event('keydown'))
          model.applyEdits([{
            forceMoveMarkers: true,
            range: new monaco.Range(1, 2, 2, 2),
            text: changeText
          }])
          expect(model.getValue()).toEqual('1ABCDEF56\n789');
          const currentRanges = model.getCurrentEditableRanges();
          expect(stringifyRange(currentRanges.test.range)).toBe(model.getFullModelRange().toString());
        })
        it('Mid Of Range - 2', function () {
          domNode.dispatchEvent(new Event('keydown'))
          model.applyEdits([{
            forceMoveMarkers: true,
            range: new monaco.Range(2, 1, 2, 4),
            text: changeText
          }])
          expect(model.getValue()).toEqual('123\nABCDEF\n789');
          const currentRanges = model.getCurrentEditableRanges();
          expect(stringifyRange(currentRanges.test.range)).toBe(model.getFullModelRange().toString());
        })
        it('Mid Of Range - 3', function () {
          domNode.dispatchEvent(new Event('keydown'))
          model.applyEdits([{
            forceMoveMarkers: true,
            range: new monaco.Range(1, 2, 3, 3),
            text: changeText
          }])
          expect(model.getValue()).toEqual('1ABCDEF9');
          const currentRanges = model.getCurrentEditableRanges();
          expect(stringifyRange(currentRanges.test.range)).toBe(model.getFullModelRange().toString());
        })
        it('End Of Range', function () {
          domNode.dispatchEvent(new Event('keydown'))
          model.applyEdits([{
            forceMoveMarkers: true,
            range: new monaco.Range(2, 1, 2, 2),
            text: changeText
          }])
          expect(model.getValue()).toEqual('123\nABCDEF56\n789');
          const currentRanges = model.getCurrentEditableRanges();
          expect(stringifyRange(currentRanges.test.range)).toBe(model.getFullModelRange().toString());
        })
      })
      describe('Multi Line Change', function () {
        let model, defaultValue, changeText = 'ABC\nDE\nF';
        beforeEach(function () {
          defaultValue = [
            '123',
            '456',
            '789'
          ].join('\n');
          model = monaco.editor.createModel(defaultValue, 'javascript');
          instanceOfConstrainedEditor.addRestrictionsTo(model, [
            {
              range: [1, 1, 3, 4],
              allowMultiline: true,
              label: 'test'
            }
          ]);
          editorInstance.setModel(model);
        })
        it('Start Of Range', function () {
          domNode.dispatchEvent(new Event('keydown'))
          model.applyEdits([{
            forceMoveMarkers: true,
            range: new monaco.Range(1, 1, 2, 1),
            text: changeText
          }])
          expect(model.getValue()).toEqual('ABC\nDE\nF456\n789');
          const currentRanges = model.getCurrentEditableRanges();
          expect(stringifyRange(currentRanges.test.range)).toBe(model.getFullModelRange().toString());
        })
        it('Mid Of Range - 1', function () {
          domNode.dispatchEvent(new Event('keydown'))
          model.applyEdits([{
            forceMoveMarkers: true,
            range: new monaco.Range(1, 2, 2, 2),
            text: changeText
          }])
          expect(model.getValue()).toEqual('1ABC\nDE\nF56\n789');
          const currentRanges = model.getCurrentEditableRanges();
          expect(stringifyRange(currentRanges.test.range)).toBe(model.getFullModelRange().toString());
        })
        it('Mid Of Range - 2', function () {
          domNode.dispatchEvent(new Event('keydown'))
          model.applyEdits([{
            forceMoveMarkers: true,
            range: new monaco.Range(2, 1, 2, 4),
            text: changeText
          }])
          expect(model.getValue()).toEqual('123\nABC\nDE\nF\n789');
          const currentRanges = model.getCurrentEditableRanges();
          expect(stringifyRange(currentRanges.test.range)).toBe(model.getFullModelRange().toString());
        })
        it('Mid Of Range - 3', function () {
          domNode.dispatchEvent(new Event('keydown'))
          model.applyEdits([{
            forceMoveMarkers: true,
            range: new monaco.Range(1, 2, 3, 3),
            text: changeText
          }])
          expect(model.getValue()).toEqual('1ABC\nDE\nF9');
          const currentRanges = model.getCurrentEditableRanges();
          expect(stringifyRange(currentRanges.test.range)).toBe(model.getFullModelRange().toString());
        })
        it('End Of Range', function () {
          domNode.dispatchEvent(new Event('keydown'))
          model.applyEdits([{
            forceMoveMarkers: true,
            range: new monaco.Range(2, 1, 2, 2),
            text: changeText
          }])
          expect(model.getValue()).toEqual('123\nABC\nDE\nF56\n789');
          const currentRanges = model.getCurrentEditableRanges();
          expect(stringifyRange(currentRanges.test.range)).toBe(model.getFullModelRange().toString());
        })
      })
    })
  })
  describe('Cumulative Change Of Range', function () {
    describe('Replace Value in Multi Line Range', function () {
      describe('Single Line Change', function () {
        let model, defaultValue, changeText = 'ABCDEF';
        beforeEach(function () {
          defaultValue = [
            '123',
            '456',
            '789'
          ].join('\n');
          model = monaco.editor.createModel(defaultValue, 'javascript');
          instanceOfConstrainedEditor.addRestrictionsTo(model, [
            {
              range: [1, 1, 3, 4],
              allowMultiline: true,
              label: 'test'
            }
          ]);
          editorInstance.setModel(model);
        })
        it('Start Of Range', function () {
          domNode.dispatchEvent(new Event('keydown'))
          model.applyEdits([{
            forceMoveMarkers: true,
            range: new monaco.Range(1, 1, 2, 1),
            text: changeText
          }])
          expect(model.getValue()).toEqual('ABCDEF456\n789');
          const currentRanges = model.getCurrentEditableRanges();
          expect(stringifyRange(currentRanges.test.range)).toBe(model.getFullModelRange().toString());
        })
        it('Mid Of Range - 1', function () {
          domNode.dispatchEvent(new Event('keydown'))
          model.applyEdits([{
            forceMoveMarkers: true,
            range: new monaco.Range(1, 2, 2, 2),
            text: changeText
          }])
          expect(model.getValue()).toEqual('1ABCDEF56\n789');
          const currentRanges = model.getCurrentEditableRanges();
          expect(stringifyRange(currentRanges.test.range)).toBe(model.getFullModelRange().toString());
        })
        it('Mid Of Range - 2', function () {
          domNode.dispatchEvent(new Event('keydown'))
          model.applyEdits([{
            forceMoveMarkers: true,
            range: new monaco.Range(2, 1, 2, 4),
            text: changeText
          }])
          expect(model.getValue()).toEqual('123\nABCDEF\n789');
          const currentRanges = model.getCurrentEditableRanges();
          expect(stringifyRange(currentRanges.test.range)).toBe(model.getFullModelRange().toString());
        })
        it('Mid Of Range - 3', function () {
          domNode.dispatchEvent(new Event('keydown'))
          model.applyEdits([{
            forceMoveMarkers: true,
            range: new monaco.Range(1, 2, 3, 3),
            text: changeText
          }])
          expect(model.getValue()).toEqual('1ABCDEF9');
          const currentRanges = model.getCurrentEditableRanges();
          expect(stringifyRange(currentRanges.test.range)).toBe(model.getFullModelRange().toString());
        })
        it('End Of Range', function () {
          domNode.dispatchEvent(new Event('keydown'))
          model.applyEdits([{
            forceMoveMarkers: true,
            range: new monaco.Range(2, 1, 2, 2),
            text: changeText
          }])
          expect(model.getValue()).toEqual('123\nABCDEF56\n789');
          const currentRanges = model.getCurrentEditableRanges();
          expect(stringifyRange(currentRanges.test.range)).toBe(model.getFullModelRange().toString());
        })
      })
      describe('Multi Line Change', function () {
        describe('First Set Change', function () {
          let model, defaultValue, changeText = 'ABC\nDE\nF';
          beforeEach(function () {
            defaultValue = [
              'This line is not editable',
              '123',
              '456',
              '789',
              'This line is not editable',
              'abc',
              'def',
              'ghi',
              'This line is not editable',
              '!@#%^&',
            ].join('\n');
            model = monaco.editor.createModel(defaultValue, 'javascript');
            instanceOfConstrainedEditor.addRestrictionsTo(model, [
              {
                range: [2, 1, 4, 4],
                allowMultiline: true,
                label: 'test'
              },
              {
                range: [6, 1, 8, 4],
                allowMultiline: true,
                label: 'alphabets'
              },
              {
                range: [10, 1, 10, 7],
                label: 'symbols'
              },
            ]);
            editorInstance.setModel(model);
          })
          it('Start Of Range', function () {
            domNode.dispatchEvent(new Event('keydown'))
            model.applyEdits([{
              forceMoveMarkers: true,
              range: new monaco.Range(2, 1, 3, 1),
              text: changeText
            }])
            const currentRanges = model.getCurrentEditableRanges();
            expect(stringifyRange(currentRanges.test.range)).toBe("[2,1 -> 5,4]");
            expect(stringifyRange(currentRanges.alphabets.range)).toBe("[7,1 -> 9,4]");
            expect(stringifyRange(currentRanges.symbols.range)).toBe("[11,1 -> 11,7]");
          })
          it('Mid Of Range - 1', function () {
            domNode.dispatchEvent(new Event('keydown'))
            model.applyEdits([{
              forceMoveMarkers: true,
              range: new monaco.Range(2, 2, 3, 2),
              text: changeText
            }])
            const currentRanges = model.getCurrentEditableRanges();
            expect(stringifyRange(currentRanges.test.range)).toBe("[2,1 -> 5,4]");
            expect(stringifyRange(currentRanges.alphabets.range)).toBe("[7,1 -> 9,4]");
            expect(stringifyRange(currentRanges.symbols.range)).toBe("[11,1 -> 11,7]");
          })
          it('Mid Of Range - 2', function () {
            domNode.dispatchEvent(new Event('keydown'))
            model.applyEdits([{
              forceMoveMarkers: true,
              range: new monaco.Range(2, 1, 2, 4),
              text: changeText
            }])
            const currentRanges = model.getCurrentEditableRanges();
            expect(stringifyRange(currentRanges.test.range)).toBe("[2,1 -> 6,4]");
            expect(stringifyRange(currentRanges.alphabets.range)).toBe("[8,1 -> 10,4]");
            expect(stringifyRange(currentRanges.symbols.range)).toBe("[12,1 -> 12,7]");
          })
          it('Mid Of Range - 3', function () {
            domNode.dispatchEvent(new Event('keydown'))
            model.applyEdits([{
              forceMoveMarkers: true,
              range: new monaco.Range(2, 2, 4, 3),
              text: changeText
            }])
            const currentRanges = model.getCurrentEditableRanges();
            expect(stringifyRange(currentRanges.test.range)).toBe("[2,1 -> 4,3]");
            expect(stringifyRange(currentRanges.alphabets.range)).toBe("[6,1 -> 8,4]");
            expect(stringifyRange(currentRanges.symbols.range)).toBe("[10,1 -> 10,7]");
          })
          it('End Of Range', function () {
            domNode.dispatchEvent(new Event('keydown'))
            model.applyEdits([{
              forceMoveMarkers: true,
              range: new monaco.Range(2, 1, 2, 2),
              text: changeText
            }])
            const currentRanges = model.getCurrentEditableRanges();
            expect(stringifyRange(currentRanges.test.range)).toBe("[2,1 -> 6,4]");
            expect(stringifyRange(currentRanges.alphabets.range)).toBe("[8,1 -> 10,4]");
            expect(stringifyRange(currentRanges.symbols.range)).toBe("[12,1 -> 12,7]");
          })
        })
        describe('Middle Set Change', function () {
          let model, defaultValue, changeText = 'ABC\nDE\nF';
          beforeEach(function () {
            defaultValue = [
              'This line is not editable',
              '123',
              '456',
              '789',
              'This line is not editable',
              'abc',
              'def',
              'ghi',
              'This line is not editable',
              '!@#%^&',
            ].join('\n');
            model = monaco.editor.createModel(defaultValue, 'javascript');
            instanceOfConstrainedEditor.addRestrictionsTo(model, [
              {
                range: [2, 1, 4, 4],
                allowMultiline: true,
                label: 'test'
              },
              {
                range: [6, 1, 8, 4],
                allowMultiline: true,
                label: 'alphabets'
              },
              {
                range: [10, 1, 10, 7],
                label: 'symbols'
              },
            ]);
            editorInstance.setModel(model);
          })
          it('Start Of Range', function () {
            domNode.dispatchEvent(new Event('keydown'))
            model.applyEdits([{
              forceMoveMarkers: true,
              range: new monaco.Range(6, 1, 7, 1),
              text: changeText
            }])
            const currentRanges = model.getCurrentEditableRanges();
            expect(stringifyRange(currentRanges.test.range)).toBe("[2,1 -> 4,4]");
            expect(stringifyRange(currentRanges.alphabets.range)).toBe("[6,1 -> 9,4]");
            expect(stringifyRange(currentRanges.symbols.range)).toBe("[11,1 -> 11,7]");
          })
          it('Mid Of Range - 1', function () {
            domNode.dispatchEvent(new Event('keydown'))
            model.applyEdits([{
              forceMoveMarkers: true,
              range: new monaco.Range(6, 2, 7, 2),
              text: changeText
            }])

            const currentRanges = model.getCurrentEditableRanges();
            expect(stringifyRange(currentRanges.test.range)).toBe("[2,1 -> 4,4]");
            expect(stringifyRange(currentRanges.alphabets.range)).toBe("[6,1 -> 9,4]");
            expect(stringifyRange(currentRanges.symbols.range)).toBe("[11,1 -> 11,7]");
          })
          it('Mid Of Range - 2', function () {
            domNode.dispatchEvent(new Event('keydown'))
            model.applyEdits([{
              forceMoveMarkers: true,
              range: new monaco.Range(6, 1, 6, 4),
              text: changeText
            }])
            const currentRanges = model.getCurrentEditableRanges();
            expect(stringifyRange(currentRanges.test.range)).toBe("[2,1 -> 4,4]");
            expect(stringifyRange(currentRanges.alphabets.range)).toBe("[6,1 -> 10,4]");
            expect(stringifyRange(currentRanges.symbols.range)).toBe("[12,1 -> 12,7]");
          })
          it('Mid Of Range - 3', function () {
            domNode.dispatchEvent(new Event('keydown'))
            model.applyEdits([{
              forceMoveMarkers: true,
              range: new monaco.Range(6, 2, 8, 3),
              text: changeText
            }])
            const currentRanges = model.getCurrentEditableRanges();
            expect(stringifyRange(currentRanges.test.range)).toBe("[2,1 -> 4,4]");
            expect(stringifyRange(currentRanges.alphabets.range)).toBe("[6,1 -> 8,3]");
            expect(stringifyRange(currentRanges.symbols.range)).toBe("[10,1 -> 10,7]");
          })
          it('End Of Range', function () {
            domNode.dispatchEvent(new Event('keydown'))
            model.applyEdits([{
              forceMoveMarkers: true,
              range: new monaco.Range(8, 1, 8, 2),
              text: changeText
            }])
            const currentRanges = model.getCurrentEditableRanges();
            expect(stringifyRange(currentRanges.test.range)).toBe("[2,1 -> 4,4]");
            expect(stringifyRange(currentRanges.alphabets.range)).toBe("[6,1 -> 10,4]");
            expect(stringifyRange(currentRanges.symbols.range)).toBe("[12,1 -> 12,7]");
          })
        })
        describe('Last Set Change', function () {
          let model, defaultValue, changeText = 'ABC\nDE\nF';
          beforeEach(function () {
            defaultValue = [
              'This line is not editable',
              '123',
              '456',
              '789',
              'This line is not editable',
              'abc',
              'def',
              'ghi',
              'This line is not editable',
              '!@#%^&',
            ].join('\n');
            model = monaco.editor.createModel(defaultValue, 'javascript');
            instanceOfConstrainedEditor.addRestrictionsTo(model, [
              {
                range: [2, 1, 4, 4],
                allowMultiline: true,
                label: 'test'
              },
              {
                range: [6, 1, 8, 4],
                allowMultiline: true,
                label: 'alphabets'
              },
              {
                range: [10, 1, 10, 7],
                allowMultiline: true,
                label: 'symbols'
              },
            ]);
            editorInstance.setModel(model);
          })
          it('Start Of Range', function () {
            domNode.dispatchEvent(new Event('keydown'))
            model.applyEdits([{
              forceMoveMarkers: true,
              range: new monaco.Range(10, 1, 10, 1),
              text: changeText
            }])
            const currentRanges = model.getCurrentEditableRanges();
            expect(stringifyRange(currentRanges.test.range)).toBe("[2,1 -> 4,4]");
            expect(stringifyRange(currentRanges.alphabets.range)).toBe("[6,1 -> 8,4]");
            expect(stringifyRange(currentRanges.symbols.range)).toBe("[10,1 -> 12,8]");
          })
          it('Mid Of Range', function () {
            domNode.dispatchEvent(new Event('keydown'))
            model.applyEdits([{
              forceMoveMarkers: true,
              range: new monaco.Range(10, 2, 10, 5),
              text: changeText
            }])
            const currentRanges = model.getCurrentEditableRanges();
            expect(stringifyRange(currentRanges.test.range)).toBe("[2,1 -> 4,4]");
            expect(stringifyRange(currentRanges.alphabets.range)).toBe("[6,1 -> 8,4]");
            expect(stringifyRange(currentRanges.symbols.range)).toBe("[10,1 -> 12,4]");
          })
          it('End Of Range', function () {
            domNode.dispatchEvent(new Event('keydown'))
            model.applyEdits([{
              forceMoveMarkers: true,
              range: new monaco.Range(10, 7, 10, 7),
              text: changeText
            }])
            const currentRanges = model.getCurrentEditableRanges();
            expect(stringifyRange(currentRanges.test.range)).toBe("[2,1 -> 4,4]");
            expect(stringifyRange(currentRanges.alphabets.range)).toBe("[6,1 -> 8,4]");
            expect(stringifyRange(currentRanges.symbols.range)).toBe("[10,1 -> 12,2]");
          })
        })
      })
    })
  })
  describe('Removing Restrictions', function () {
    describe('Using `removeRestrictionsIn` API in instanceOfRestrictor', function () {
      let model, defaultValue;
      beforeAll(function () {
        defaultValue = [
          '123',
          '456',
          '789'
        ].join('\n');
        model = monaco.editor.createModel(defaultValue, 'javascript');
        instanceOfConstrainedEditor.addRestrictionsTo(model, [
          {
            range: [1, 1, 3, 4],
            allowMultiline: true,
            label: 'test'
          }
        ]);
        editorInstance.setModel(model);
      })
      const listOfAPIsInNewModel = [
        'editInRestrictedArea',
        'disposeRestrictions',
        'getValueInEditableRanges',
        'updateRestrictions',
        'getCurrentEditableRanges',
        '_isRestrictedModel',
        '_isCursorAtCheckPoint',
        '_currentCursorPositions',
        '_editableRangeChangeListener',
        '_restrictionChangeListener',
      ]
      // Check for all the values before removing
      listOfAPIsInNewModel.forEach(function (api) {
        it('Does model has this api : ' + api, function () {
          expect(model[api]).toBeDefined();
        })
      })
      it('Expect the instance to remove restrictions', function () {
        expect(instanceOfConstrainedEditor.removeRestrictionsIn(model)).toBe(model)
      })
      listOfAPIsInNewModel.forEach(function (api) {
        it('is this api removed from model now: ' + api, function () {
          expect(model[api]).not.toBeDefined();
        })
      })
    })
    describe('Using `disposeRestrictions` API in model', function () {
      let model, defaultValue, changeText = "ABC";
      beforeAll(function () {
        defaultValue = [
          '123',
          '456',
          '789'
        ].join('\n');
        model = monaco.editor.createModel(defaultValue, 'javascript');
        instanceOfConstrainedEditor.addRestrictionsTo(model, [
          {
            range: [2, 1, 3, 4],
            allowMultiline: true,
            label: 'test'
          }
        ]);
        editorInstance.setModel(model);

      })
      const listOfAPIsInNewModel = [
        'editInRestrictedArea',
        'disposeRestrictions',
        'getValueInEditableRanges',
        'updateRestrictions',
        'getCurrentEditableRanges',
        '_isRestrictedModel',
        '_isCursorAtCheckPoint',
        '_currentCursorPositions',
        '_editableRangeChangeListener',
        '_restrictionChangeListener'
      ]
      // Check for all the values before removing
      listOfAPIsInNewModel.forEach(function (api) {
        it('Does model has this api : ' + api, function () {
          expect(model[api]).toBeDefined();
        })
      })
      it('Expect the model to have restrictions', function (done) {
        domNode.dispatchEvent(new Event('keydown'))
        editorInstance.executeEdits('test', [{
          forceMoveMarkers: true,
          range: new monaco.Range(1, 1, 1, 1),
          text: changeText
        }])
        // Immediate value is with the changeText as the undo is not yet triggered
        expect(model.getValue()).toBe(changeText + defaultValue);
        setTimeout(function () {
          done();
          expect(model.getValue()).toBe(defaultValue);
        }, 0)
      })
      it('Expect the model to remove restrictions', function () {
        expect(model.disposeRestrictions()).toBe(model)
      })
      it('Expect the model not to have restrictions', function (done) {
        domNode.dispatchEvent(new Event('keydown'))
        editorInstance.executeEdits('test', [{
          forceMoveMarkers: true,
          range: new monaco.Range(1, 1, 1, 1),
          text: changeText
        }])
        expect(model.getValue()).toBe(changeText + defaultValue);
        setTimeout(function () {
          done();
          expect(model.getValue()).toBe(changeText + defaultValue);
        }, 0)
      })
      listOfAPIsInNewModel.forEach(function (api) {
        it('is this api removed from model now: ' + api, function () {
          expect(model[api]).not.toBeDefined();
        })
      })
    })
  })
  describe('Destroying Restrictions Instance from editorInstance', function () {
    let model, defaultValue, spy;
    beforeEach(function () {
      defaultValue = [
        '123',
        '456',
        '789'
      ].join('\n');
      model = monaco.editor.createModel(defaultValue, 'javascript');
      instanceOfConstrainedEditor.addRestrictionsTo(model, [
        {
          range: [1, 1, 3, 4],
          allowMultiline: true,
          label: 'test'
        }
      ]);
      editorInstance.setModel(model);
    })
    it('Using `disposeConstrainer` API in instanceOfConstrainedEditor', function () {
      instanceOfConstrainedEditor.disposeConstrainer(editorInstance);
      expect(instanceOfConstrainedEditor._listener).not.toBeDefined();
    })
  })
})