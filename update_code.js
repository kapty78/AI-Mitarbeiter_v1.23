const fs = require('fs'); const path = require('path'); const filePath = 'app/chat/page.tsx'; const fileContent = fs.readFileSync(filePath, 'utf8'); const updatedContent = fileContent.replace(/(              }\s+            } finally {)/s, '              }
              // Finale UI-Aktualisierung nach dem Streaming-Loop
              setMessages(prevMessages => 
                prevMessages.map(msg => 
                  msg.id === messageIdToUpdate 
                    ? { 
                        ...msg, 
                        content: collectedContent,
                        isTypewriting: false
                      }
                    : msg
                )
              );
            } finally {'); fs.writeFileSync(filePath, updatedContent, 'utf8'); console.log('File updated successfully');
