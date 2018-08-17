const Web3 = require('web3')
const sleep = require('./utils').sleep

class Peer {
  constructor ({web3Provider, topic, symKeyPassword}) {
    this.web3 = new Web3(web3Provider)
    this.topic = topic
    this.symKeyPassword = symKeyPassword
  }

  async init () {
    this.symKeyID =
      await this.web3.shh.generateSymKeyFromPassword(this.symKeyPassword)
    this.privKeyID = await this.web3.shh.newKeyPair()

    this.topicFilter = await this.web3.shh.newMessageFilter({
      symKeyID: this.symKeyID,
      topics: [this.topic]
    })

    this.personalFilter = await this.web3.shh.newMessageFilter({
      privateKeyID: this.privKeyID,
      allowP2P: true
    })

    this.pubKey = await this.web3.shh.getPublicKey(this.privKeyID)
  }

  async sendGroupMessage (msg) {
    return this.web3.shh.post({
      symKeyID: this.symKeyID,
      ttl: 60,
      topic: this.topic,
      payload: Web3.utils.utf8ToHex(msg),
      powTarget: 0.2,
      powTime: 2
    })
  }

  async sendDirectMessage (pubKey, msg) {
    return this.web3.shh.post({
      pubKey,
      ttl: 60,
      topic: this.topic,
      payload: Web3.utils.utf8ToHex(msg),
      powTarget: 0.2,
      powTime: 2
    })
  }

  async getGroupMessages (expectedMsgs = 0) {
    return this._internalGetMessages(this.topicFilter, expectedMsgs)
  }

  async getOwnMessages (expectedMsgs = 0) {
    return this._internalGetMessages(this.personalFilter, expectedMsgs)
  }

  async _internalGetMessages (filter, expectedMsgs = 0, timeout = 500) {
    const ctx = {
      msgs: [],
      isDone: false,
      timeout,
      timeoutHandler: null
    }

    return new Promise(async resolve => {
      startTimeout(ctx, resolve)

      while (!ctx.isDone) {
        await getFilterMessages(this.web3, filter, ctx)
        if (ctx.msgs.length >= expectedMsgs) {
          done(ctx, resolve)
        }
        await sleep(100)
      }
    })

    function startTimeout (ctx, cb) {
      ctx.timeoutHandler = setTimeout(() => done(ctx, cb), timeout)
    }

    function done (ctx, cb) {
      ctx.isDone = true
      clearTimeout(ctx.timeoutHandler)
      cb(ctx.msgs)
    }

    async function getFilterMessages (web3, filter, ctx) {
      const msgs = await web3.shh.getFilterMessages(filter)
      ctx.msgs = ctx.msgs.concat(msgs)
    }
  }

}

module.exports = Peer
