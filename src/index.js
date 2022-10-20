import EventSource from 'eventsource';
  let timeCloseConnecting = false;
  let countAttemptConnect = 0
  async function sseConnect() {
    const url = 'https://api.dev.educont.ru/api/v1/public/sse/connect'
    const token = await getEducontToken()
    const authHeader = { headers: { Authorization: `Bearer ${token}` } };
    const es = new EventSource(url, authHeader);
    es.onopen = (e) => {
      console.log('Событие: open', e);
    };
    es.onerror = (e) => {
      if(!timeCloseConnecting) timeCloseConnecting = new Date()
      console.log('Событие: error', e);
      countAttemptConnect += 1
      console.log('Попытка подключения #', countAttemptConnect)
      setTimeout(sseConnect, countAttemptConnect * 1000)
    };
    es.onmessage = async (e) => {
      if(timeCloseConnecting && (new Date() - timeCloseConnecting) > 5000) {
        await fetch(`http:localhost:6547/educont/fetchandsaveeducontuserinfo`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            date: timeCloseConnecting
          }
        })
        timeCloseConnecting = false
      }
      console.log(`Событие: message, данные: ${e.data}`);
      updateUserInfo(e.data)
    };

  }
  async function getEducontToken() {
    const data = await (await fetch(`http:localhost:6547/educont/fetchtokensse`)).json()
    return data.token
  }
  async function updateUserInfo(data) {
    console.log(data)
    await fetch(`http:localhost:6547/educont/updateeucontuserinfo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data
    })
  }

  sseConnect()
