/// <reference path="./index.d.ts" />

const buttonClasses = `border border-solid rounded rounded-[4px] flex cy-button-width font-medium items-center transition duration-150 hover:shadow-ring-hover focus:shadow-ring-focus active:shadow-ring-focus disabled:hover:shadow-none disabled:cursor-not-allowed focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:outline-none text-white border-white/20 hocus:border-white/60 disabled:hocus:shadow-none hocus:shadow-white/20 disabled:text-gray-700 disabled:hocus:border-white/20 disabled:border-white/20 focus:ring-gray-200 text-[14px] leading-[18px] min-h-[20px] px-[8px] py-[4px]`

/**
 * Humanize duration in milliseconds
 * @param {number} ms - Duration in milliseconds
 * @returns {string} Humanized duration (e.g., "300ms", "1.2s", "50s", "1m10s")
 */
function humanizeDuration(ms) {
  if (ms < 1000) {
    return `${ms}ms`
  } else if (ms < 60000) {
    // Less than 1 minute
    const seconds = (ms / 1000).toFixed(1)
    // Remove trailing .0
    return seconds.endsWith('.0')
      ? `${parseInt(seconds)}s`
      : `${seconds}s`
  } else {
    // 1 minute or more
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.round((ms % 60000) / 1000)
    if (seconds === 0) {
      return `${minutes}m`
    }
    return `${minutes}m${seconds}s`
  }
}

Cypress.Commands.add(
  'think',
  {
    prevSubject: 'optional',
  },
  (subject, prompt, options) => {
    if (subject && !Cypress.dom.isJquery(subject)) {
      throw new Error(
        'The think command can only be called on a DOM element or without a subject',
      )
    }
    if (!prompt) {
      throw new Error('A prompt is required for the think command')
    }

    const placeholders = options?.placeholders || {}

    const logProps = {
      name: 'think',
      message: '**thinking...**',
    }
    Cypress.log(logProps)

    // Add clear cache button to the "thinking..." log message
    cy.wait(100, { log: false }).then(() => {
      // get the very last command element in the Cypress Command Log
      const logElements = window.top.document.querySelectorAll(
        '.command.command-name-think',
      )
      const lastLogElement = logElements[logElements.length - 1]
      if (lastLogElement) {
        const controls = lastLogElement.querySelector(
          '.command-controls',
        )
        if (controls) {
          // grab the current spec filename and test title
          const specFilename = Cypress.spec.relative
          const testTitle = Cypress.currentTest.titlePath.join(' > ')

          const clearCacheButton = document.createElement('button')
          clearCacheButton.innerText = '🗑️'
          clearCacheButton.className = buttonClasses
          clearCacheButton.title =
            'Clear all generated thoughts cache for this test'
          clearCacheButton.onclick = (e) => {
            e.stopPropagation()

            // find the data-testid "save-prompt" button and remove it too
            const savePromptButtons =
              window.top.document.querySelectorAll(
                'button[data-testid="save-prompt"]',
              )
            Array.from(savePromptButtons).forEach(
              (savePromptButton) => {
                savePromptButton.parentElement.removeChild(
                  savePromptButton,
                )
              },
            )

            fetch('http://localhost:4321/clear-cached-thoughts', {
              method: 'POST',
              mode: 'cors',
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
        }
      }
    })

    const generatedCommands = []
    let lastCommand = null

    // split prompt into individual lines
    const lines = (
      Array.isArray(prompt) ? prompt : prompt.trim().split('\n')
    )
      .map((line) => line.trim())
      // remove empty lines
      .filter(Boolean)
      // remove comment lines starting with //
      .filter((line) => !line.startsWith('//'))

    const processPromptLines = () => {
      lines.forEach(async (line, k) => {
        cy.log(`**step ${k + 1}: ${line}**`).then(() => {
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
            ({
              command,
              totalTokens,
              fromCache,
              client,
              model,
              durationMs,
              promptHash,
            }) => {
              if (fromCache) {
                cy.log(
                  `🤖⚡️ ${command} (${totalTokens} tokens saved)`,
                )
              } else {
                const timing = durationMs
                  ? ` in ${humanizeDuration(durationMs)}`
                  : ''
                cy.log(
                  `🤖 ${command} (${totalTokens} tokens used${timing})`,
                )
              }

              // replace placeholders in the command
              Object.entries(placeholders).forEach(([key, value]) => {
                const placeholderPattern = new RegExp(
                  `{{\\s*${key}\\s*}}`,
                  'g',
                )
                command = command.replace(placeholderPattern, value)
              })

              try {
                // execute the command
                // eslint-disable-next-line no-eval
                eval(command)

                lastCommand = { client, model }

                cy.then(() => {
                  // the command has succeeded
                  // add the original line as the comment for clarity
                  generatedCommands.push(`// ${line}`)
                  generatedCommands.push(command)
                })

                if (!fromCache) {
                  // this command was just generated
                  // we need to let the backend know to save it
                  cy.request({
                    method: 'POST',
                    url: 'http://localhost:4321/save-prompt',
                    body: {
                      promptHash,
                    },
                    // do not pollute the command log
                    // with these utility messages
                    log: false,
                  })
                }
              } catch (err) {
                throw new Error(
                  `Failed to execute generated command: ${command}\nError: ${err.message}`,
                )
              }
            },
          )
        })
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
          saveButton.setAttribute('data-testid', 'save-prompt')
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
              mode: 'cors',
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
