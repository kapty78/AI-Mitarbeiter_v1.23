const fs = require('fs'); const filePath = 'app/chat/page.tsx'; fs.readFile(filePath, 'utf8', function (err, data) { if (err) { return console.log(err); } const result = data.replace(/              }\s+            } finally {/s, '              }
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
            } finally {'); fs.writeFile(filePath, result, 'utf8', function (err) { if (err) return console.log(err); console.log('File updated successfully'); }); });
