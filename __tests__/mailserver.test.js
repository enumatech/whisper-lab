const Web3 = require('web3')
const Peer = require('../src/Peer')

const topic = Web3.utils.randomHex(4)

async function makePeer () {
  const peer = new Peer({
    web3Provider: 'http://localhost:8545',
    symKeyPassword: 'test',
    topic
  })
  await peer.init()
  return peer
}

let mailServer, alice

beforeEach(async () => {
  mailServer = await makePeer()
  alice = await makePeer()
})

test('peers can send and receive direct message', async () => {
  await mailServer.sendDirectMessage(alice.pubKey, 'Hello!')

  const mailServerGroupMsgs = await mailServer.getGroupMessages(1)
  const mailServerOwnMsgs = await mailServer.getOwnMessages(1)
  const aliceGroupMsgs = await alice.getGroupMessages(1)
  const aliceOwnMsgs = await alice.getOwnMessages(1)

  expect(mailServerGroupMsgs.length).toBe(0)
  expect(mailServerOwnMsgs.length).toBe(0)
  expect(aliceGroupMsgs.length).toBe(0)
  expect(aliceOwnMsgs.length).toBe(1)
  expect(aliceOwnMsgs[0].payload).toBe(Web3.utils.utf8ToHex('Hello!'))
})

test('peers can send group message', async () => {
  await mailServer.sendGroupMessage('Hello, Group!')

  const mailServerMsgs = await mailServer.getGroupMessages(1)
  const aliceMsgs = await alice.getGroupMessages(1)

  expect(mailServerMsgs).toHaveLength(1)
  expect(aliceMsgs).toHaveLength(1)
  expect(mailServerMsgs[0].payload).toBe(Web3.utils.utf8ToHex('Hello, Group!'))
  expect(aliceMsgs[0].payload).toBe(Web3.utils.utf8ToHex('Hello, Group!'))
})

describe('Messaging scalability, where N = |peers|, M = |messages|', () => {
  describe('For a single Whisper hub', () => {
    const msgs = ['MSG#1', 'MSG#2', 'MSG#3']
    const n = 2

    test('group message is O(N*M)', async () => {
      for (const msg of msgs) {
        await mailServer.sendGroupMessage(msg)
      }

      const mailServerMsgs = await mailServer.getGroupMessages(msgs.length)
      const aliceMsgs = await alice.getGroupMessages(msgs.length)

      const m = msgs.length
      expect([...mailServerMsgs, ...aliceMsgs]).toHaveLength(n * m)
    })

    test('direct message is O(M)', async () => {
      for (const msg of msgs) {
        await mailServer.sendDirectMessage(alice.pubKey, msg)
      }

      const aliceMsgs = await alice.getOwnMessages(msgs.length)

      const m = msgs.length
      expect(aliceMsgs).toHaveLength(m)
    })
  })
})
