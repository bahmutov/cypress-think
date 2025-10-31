/// <reference path="./index.d.ts" />

const buttonClasses = `border border-solid rounded rounded-[4px] flex cy-button-width font-medium items-center transition duration-150 hover:shadow-ring-hover focus:shadow-ring-focus active:shadow-ring-focus disabled:hover:shadow-none disabled:cursor-not-allowed focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:outline-none text-white border-white/20 hocus:border-white/60 disabled:hocus:shadow-none hocus:shadow-white/20 disabled:text-gray-700 disabled:hocus:border-white/20 disabled:border-white/20 focus:ring-gray-200 text-[14px] leading-[18px] min-h-[20px] px-[8px] py-[4px]`

Cypress.Commands.add(
  'think',
  {
    prevSubject: 'optional',
  },
  (subject, prompt) => {
    if (subject && !Cypress.dom.isJquery(subject)) {
      throw new Error(
        'The think command can only be called on a DOM element or without a subject',
      )
    }
    if (!prompt) {
      throw new Error('A prompt is required for the think command')
    }

    const logProps = {
      name: 'think',
      message: '**thinking...**',
    }
    Cypress.log(logProps)

    const generatedCommands = []
    let lastCommand = null

    // split prompt into individual lines
    const lines = (
      Array.isArray(prompt) ? prompt : prompt.trim().split('\n')
    )
      .map((line) => line.trim())
      // remove empty lines
      .filter(Boolean)

    const processPromptLines = () => {
      lines.forEach(async (line, k) => {
        cy.log(`**step ${k + 1}: ${line}**`)

        // current html - either the entire page (body) or the subject element
        const html =
          subject?.html() || cy.state('document')?.body?.outerHTML
        cy.task(
          'cypress:think',
          {
            prompt: line,
            html,
            specFilename: Cypress.spec.relative,
            testTitle: Cypress.currentTest.titlePath.join(' > '),
          },
          { log: false },
        ).then(
          ({ command, totalTokens, fromCache, client, model }) => {
            lastCommand = { client, model }
            if (fromCache) {
              cy.log(`🤖⚡️ ${command} (${totalTokens} tokens saved)`)
            } else {
              cy.log(`🤖 ${command} (${totalTokens} tokens used)`)
            }
            // execute the command
            // eslint-disable-next-line no-eval
            eval(command)

            cy.then(() => {
              // the command has succeeded
              // add the original line as the comment for clarity
              generatedCommands.push(`// ${line}`)
              generatedCommands.push(command)
            })
          },
        )
      })
    }

    const finishThinking = () => {
      let message = '**thinking accomplished**'
      if (lastCommand && lastCommand.client && lastCommand.model) {
        message = `**thinking accomplished** (${lastCommand.client} ${lastCommand.model})`
      }

      // the entire prompt has worked!
      cy.log(message)
        .wait(100, { log: false })
        .then(() => {
          // TODO: add support for replacing .think(array of strings)
          if (Array.isArray(prompt)) {
            return
          }

          // get the very last command element in the Cypress Command Log
          const logElements = window.top.document.querySelectorAll(
            '.command.command-name-log',
          )
          const lastLogElement = logElements[logElements.length - 1]
          if (!lastLogElement) {
            return
          }
          const controls = lastLogElement.querySelector(
            '.command-controls',
          )
          if (!controls) {
            return
          }

          // grab the current spec filename and test title
          // before the test switches to something like a hook
          const specFilename = Cypress.spec.relative
          const testTitle = Cypress.currentTest.titlePath.join(' > ')

          const saveButton = document.createElement('button')
          saveButton.innerText = '💾'
          saveButton.title = 'Replace prompt with the generated code'
          saveButton.className = buttonClasses
          saveButton.onclick = (e) => {
            e.stopPropagation()
            // since we are working with cy.within to generate the code
            // we should wrap the generated commands too
            const generated =
              '.within(() => {\n' +
              generatedCommands.join('\n') +
              '\n})'

            fetch('http://localhost:4321/save-generated-thought', {
              method: 'POST',
              cors: 'cors',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                specFilename,
                testTitle,
                prompt,
                generatedCode: generated,
              }),
            }).then((response) => {
              if (response.ok) {
                // remove the button completely
                controls.removeChild(saveButton)
              } else {
                console.error(
                  'Failed to save generated code',
                  response.statusText,
                )
                saveButton.innerText = '❌'
              }
            })
          }
          controls.appendChild(saveButton)

          const clearCacheButton = document.createElement('button')
          clearCacheButton.innerText = '🗑️'
          clearCacheButton.className = buttonClasses
          clearCacheButton.title =
            'Clear all generated thoughts cache for this test'
          clearCacheButton.onclick = (e) => {
            e.stopPropagation()

            fetch('http://localhost:4321/clear-cached-thoughts', {
              method: 'POST',
              cors: 'cors',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                specFilename,
                testTitle,
              }),
            }).then((response) => {
              if (response.ok) {
                // remove the button completely
                controls.removeChild(clearCacheButton)
              } else {
                console.error(
                  'Failed to clear the test generated code cache',
                  response.statusText,
                )
                clearCacheButton.innerText = '❌'
              }
            })
          }
          controls.appendChild(clearCacheButton)
        })

      // always yield the original subject
      cy.wrap(subject, { log: false })
    }

    if (subject) {
      // process each line within the subject element
      cy.wrap(subject, { log: false })
        .within(() => {
          processPromptLines()
        })
        .then(finishThinking)
    } else {
      cy.then(processPromptLines).then(finishThinking)
    }
  },
)
