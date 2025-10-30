/// <reference path="./index.d.ts" />

Cypress.Commands.add(
  'think',
  {
    prevSubject: 'element',
  },
  (subject, prompt) => {
    if (!prompt) {
      throw new Error('A prompt is required for the think command')
    }

    const logProps = {
      name: 'think',
      message: '**thinking...**',
    }
    Cypress.log(logProps)

    const generatedCommands = []

    // split prompt into individual lines
    const lines = (
      Array.isArray(prompt) ? prompt : prompt.trim().split('\n')
    )
      .map((line) => line.trim())
      // remove empty lines
      .filter(Boolean)

    // process each line within the subject element
    cy.wrap(subject, { log: false })
      .within(() => {
        lines.forEach(async (line, k) => {
          cy.log(`**step ${k + 1}: ${line}**`)

          cy.task(
            'cypress:think',
            {
              prompt: line,
              // TODO: make sure to grab the latest HTML after previous commands
              html: subject?.html() || '',
              specFilename: Cypress.spec.relative,
              testTitle: Cypress.currentTest.titlePath.join(' > '),
            },
            { log: false },
          ).then(({ command, totalTokens, fromCache }) => {
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
          })
        })
      })
      .then(() => {
        // the entire prompt has worked!
        cy.log('**thinking accomplished**')
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
            const saveButton = document.createElement('button')
            saveButton.innerText = '💾'
            saveButton.title =
              'Replace prompt with the generated code'
            saveButton.onclick = (e) => {
              e.stopPropagation()
              console.log('Saving prompt NOT IMPLEMENTED YET')
              console.log(prompt)
              // since we are working with cy.within to generate the code
              // we should wrap the generated commands too
              const generated =
                '.within(() => {\n' +
                generatedCommands.join('\n') +
                '\n})'
              console.log(generated)

              fetch('http://localhost:4321/save-generated-thought', {
                method: 'POST',
                cors: 'cors',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  specFilename: Cypress.spec.relative,
                  testTitle:
                    Cypress.currentTest.titlePath.join(' > '),
                  prompt,
                  generatedCode: generated,
                }),
              }).then((response) => {
                if (response.ok) {
                  saveButton.disabled = true
                  saveButton.innerText = '✅'
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
          })

        // always yield the original subject
        cy.wrap(subject, { log: false })
      })
  },
)
