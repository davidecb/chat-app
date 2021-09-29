const socket = io()
const $sendButton = document.querySelector('#send-button')
const $sendLocButton = document.querySelector('#send-loc-button')
const $messageForm = document.querySelector('#message-form')
const $messageInput = document.querySelector('#message-input')
const $messages = document.querySelector('#messages')

//   TEMPLATES
const messageTemplate = document.querySelector('#messageTemplate').innerHTML
const locationTemplate = document.querySelector('#locationTemplate').innerHTML
const sidebarTemplate = document.querySelector('#sidebarTemplate').innerHTML

//   OPTIONS
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoscroll = () => {
    // new message element
    const $newMessage = $messages.lastElementChild
    //height of the last message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin    
    // Visible height
    const visibleHeight = $messages.offsetHeight
    // height of messages container
    const containerHeight = $messages.scrollHeight
    // Distance of the scroll from de top
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
    

}

socket.on('message', (message) => {
    const html = Mustache.render(messageTemplate, { 
        message: message.text,
        username: message.username,
        createdAt: moment(message.createdAt).format('kk:mm')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('locationMessage', (message) => {
    const html = Mustache.render(locationTemplate, { 
        locationURL: message.text,
        username: message.username,
        createdAt: moment(message.createdAt).format('kk:mm') 
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()

    $sendButton.setAttribute('disabled', 'disabled')
    $sendLocButton.setAttribute('disabled', 'disabled')
    //const message = $messageInput.value
    const message = e.target.elements.messageInput.value
    if (message) {
        socket.emit('sendMessage', message, (error) => {
            if (error) {
                return console.log(error)
            }
            console.log('Message delivered!')
            $messageInput.value = ""
        })
    }
    $messageInput.focus()
    $sendButton.removeAttribute('disabled')
    $sendLocButton.removeAttribute('disabled')
})

$sendLocButton.addEventListener('click', () => {
    $sendButton.setAttribute('disabled', 'disabled')
    $sendLocButton.setAttribute('disabled', 'disabled')
    if (!navigator.geolocation) {
        $messageInput.focus()
        $sendButton.removeAttribute('disabled')
        return console.log('Geolocation is not supported by your browser')
    }    

    navigator.geolocation.getCurrentPosition((position) => {
        const location = {}
        location.latitude = position.coords.latitude
        location.longitude = position.coords.longitude
        socket.emit('sendLocation', location, () => {
            console.log('location delivered!')
            $messageInput.focus()
            $sendButton.removeAttribute('disabled')
            $sendLocButton.removeAttribute('disabled') 
        })
    })
})

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})