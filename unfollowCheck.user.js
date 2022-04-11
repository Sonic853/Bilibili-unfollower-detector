// ==UserScript==
// @name         互关检测
// @namespace    http://blog.853lab.com/
// @version      0.1
// @description  检测互关的人
// @author       Sonic853
// @include      https://space.bilibili.com/*
// @run-at       document-end
// @license      MIT License
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @grant        GM_xmlhttpRequest
// @grant        GM_getResourceText
// ==/UserScript==
//
// 律师函收到之日，即是我死期到来之时。
// 学写代码学到现在也不过是一枚棋子，随用随弃。
// ：）
//

(function () {
  'use strict'


  const DEV_Log = Boolean(localStorage.getItem("Dev-853"))
  const localItem = "Lab8A"
  const NAME = "互关检测"
  const Console_log = function (text) {
    let d = new Date().toLocaleTimeString()
    console.log("[" + NAME + "][" + d + "]: " + text)
  }
  const Console_Devlog = function (text) {
    let d = new Date().toLocaleTimeString()
    DEV_Log && (console.log("[" + NAME + "][" + d + "]: " + text))
  }
  const Console_error = function (text) {
    let d = new Date().toLocaleTimeString()
    console.error("[" + NAME + "][" + d + "]: " + text)
  }

  const snooze = ms => new Promise(resolve => setTimeout(resolve, ms))

  const RList = new class {
    time = 500
    #list = -1
    async Push() {
      this.#list++
      await snooze(this.#list * this.time)
      Promise.resolve().finally(() => {
        setTimeout(() => { this.#list-- }, (this.#list + 1) * this.time)
      })
    }
  }

  if (typeof GM_xmlhttpRequest === 'undefined' && typeof GM_registerMenuCommand === 'undefined' && typeof GM_setValue === 'undefined' && typeof GM_getValue === 'undefined' && typeof GM_addStyle === 'undefined') {
    Console_error("GM is no Ready.")
  } else {
    Console_log("GM is Ready.")
  }

  /**
   * 
   * @param {string} url 
   * @param {string} method 
   * @param {Object.<string, any>} headers 
   * @param {string} responseType 
   * @param {*} successHandler 
   * @param {*} errorHandler 
   * @returns 
   */
  let HTTPsend = function (url, method, headers, responseType, successHandler, errorHandler) {
    Console_Devlog(url)
    if (typeof GM_xmlhttpRequest != 'undefined') {
      return new Promise((rl, rj) => {
        try {
          GM_xmlhttpRequest({
            method,
            url,
            headers,
            responseType,
            onerror: function (response) {
              Console_Devlog(response.status)
              errorHandler && errorHandler(response.status)
              rj(response.status)
            },
            onload: function (response) {
              let status
              if (response.readyState == 4) { // `DONE`
                status = response.status
                if (status == 200) {
                  Console_Devlog(response.response)
                  successHandler && successHandler(response.response)
                  rl(response.response)
                } else {
                  Console_Devlog(status)
                  errorHandler && errorHandler(status)
                  rj(status)
                }
              }
            },
          })
        } catch (error) {
          rj(error)
        }
      })
    } else {
      return new Promise((rl, rj) => {
        try {
          let xhr = new XMLHttpRequest()
          xhr.open(method, url, true)
          xhr.withCredentials = true
          xhr.responseType = responseType
          xhr.onreadystatechange = function () {
            let status
            if (xhr.readyState == 4) { // `DONE`
              status = xhr.status
              if (status == 200) {
                Console_log(xhr.response)
                successHandler && successHandler(xhr.response)
                rl(xhr.response)
              } else {
                Console_log(status)
                errorHandler && errorHandler(status)
                rj(status)
              }
            }
          }
          xhr.send()
        } catch (error) {
          rj(error)
        }
      })
    }
  }

  let BLab8A = class {
    // attribute 为0表示只关注了我，1表示我悄悄关注了他，2表示只有我关注了他，6表示互相关注
    // 其中悄悄关注无法知道他是否关注我，所以只有我关注了他才会是2，互相关注则是6
    /**
     * @type {Object.<string, {
     *    mid: number,
     *    attribute: number,
     *    mtime: number,
     *    tag: null,
     *    special: number,
     *    contract_info: {
     *     is_contractor: boolean,
     *     ts: number,
     *     is_contract: boolean,
     *     user_attr: number
     *    },
     *    uname: string,
     *    face: string,
     *    sign: string,
     *    face_nft: number,
     *    official_verify: {
     *     type: number,
     *     desc: string
     *    }
     *    vip: {
     *     vipType: number,
     *     vipDueDate: number,
     *     dueRemark: string,
     *     accessStatus: number,
     *     vipStatus: number,
     *     vipStatusWarn: string,
     *     themeType: number,
     *     label: {
     *      path: string,
     *      text: string,
     *      label_theme: string,
     *      text_color: string,
     *      bg_style: number,
     *      bg_color: string,
     *      border_color: string
     *     },
     *     avatar_subscript: number,
     *     nickname_color: string,
     *     avatar_subscript_url: string
     *    }
     *  }[]>} data
     */
    data
    constructor() {
      this.data = this.load()
    }
    load() {
      Console_log("正在加载数据")
      const defaultData = "{\"follow\":[],\"follow2\":[],\"unfollowed\":[],\"unfollowed2\":[],\"fans\":[],\"unfans\":[],\"whispers\":[],\"unwhispers\":[],\"whispersfollow\":[]}"
      if (typeof GM_getValue !== 'undefined') {
        let gdata = GM_getValue(localItem, JSON.parse(defaultData))
        return gdata
      } else {
        let ldata = JSON.parse(localStorage.getItem(localItem) === null ? defaultData : localStorage.getItem(localItem))
        return ldata
      }
    }
    save(d) {
      Console_log("正在保存数据")
      d === undefined ? (d = this.data) : (this.data = d)
      typeof GM_getValue != 'undefined' ? GM_setValue(localItem, d) : localStorage.setItem(localItem, JSON.stringify(d))
      return this
    }
  }
  let bLab8A = new BLab8A()

  const BilibiliFollowChecker = new class {
    /**
     * @type {number}
     */
    vmid = 1968333
    /**
     * @type {number}
     */
    ps = 20
    /**
     * @type {number}
     */
    pn = 1
    /**
     * @type {number}
     */
    total = 0
    /**
     * @type {number}
     */
    fansTotal = 0
    /**
     * @type {number}
     */
    fansMaxpn = 50
    get stat() {
      return `https://api.bilibili.com/x/relation/stat?vmid=${this.vmid}&jsonp=jsonp`
    }
    get followUrl() {
      return `https://api.bilibili.com/x/relation/followings?vmid=${this.vmid}&pn=${this.pn}&ps=${this.ps}&order=desc&order_type=`
    }
    get followReferer() {
      return `https://space.bilibili.com/${this.vmid}/fans/follow`
    }
    get fansUrl() {
      return `https://api.bilibili.com/x/relation/followers?vmid=${this.vmid}&pn=${this.pn}&ps=${this.ps}&order=desc&order_type=attention`
    }
    get fansReferer() {
      return `https://space.bilibili.com/${this.vmid}/fans/fans`
    }
    get whispersUrl() {
      return `https://api.bilibili.com/x/relation/whispers?pn=${this.pn}&ps=${this.ps}`
    }
    get whispersReferer() {
      return `https://space.bilibili.com/${this.vmid}/fans/follow`
    }
    checkuid = 0
    get relationUrl() {
      return `https://api.bilibili.com/x/space/acc/relation?mid=${this.checkuid}`
    }
    get relationReferer() {
      return `https://space.bilibili.com/${this.checkuid}`
    }
    async getFollowings() {
      this.pn = 1
      console.log(`正在获取第${this.pn}页关注列表`);
      /**
       * @type {{
       * code: number,
       * message: string,
       * ttl: number,
       * data: {
       *  list: {
       *    mid: number,
       *    attribute: number,
       *    mtime: number,
       *    tag: null,
       *    special: number,
       *    contract_info: {
       *     is_contractor: boolean,
       *     ts: number,
       *     is_contract: boolean,
       *     user_attr: number
       *    },
       *    uname: string,
       *    face: string,
       *    sign: string,
       *    face_nft: number,
       *    official_verify: {
       *     type: number,
       *     desc: string
       *    }
       *    vip: {
       *     vipType: number,
       *     vipDueDate: number,
       *     dueRemark: string,
       *     accessStatus: number,
       *     vipStatus: number,
       *     vipStatusWarn: string,
       *     themeType: number,
       *     label: {
       *      path: string,
       *      text: string,
       *      label_theme: string,
       *      text_color: string,
       *      bg_style: number,
       *      bg_color: string,
       *      border_color: string
       *     },
       *     avatar_subscript: number,
       *     nickname_color: string,
       *     avatar_subscript_url: string
       *    }
       *  }[],
       *  re_version: number,
       *  total: number
       * }
       * }}
       */
      const data = JSON.parse(await HTTPsend(this.followUrl, "GET", { "Referer": this.followReferer }))
      if (data && data.code === 0) {
        this.total = data.data.total
        /**
         * @type {{
         * mid: number,
         *    attribute: number,
         *    mtime: number,
         *    tag: null,
         *    special: number,
         *    contract_info: {
         *     is_contractor: boolean,
         *     ts: number,
         *     is_contract: boolean,
         *     user_attr: number
         *    },
         *    uname: string,
         *    face: string,
         *    sign: string,
         *    face_nft: number,
         *    official_verify: {
         *     type: number,
         *     desc: string
         *    }
         *    vip: {
         *     vipType: number,
         *     vipDueDate: number,
         *     dueRemark: string,
         *     accessStatus: number,
         *     vipStatus: number,
         *     vipStatusWarn: string,
         *     themeType: number,
         *     label: {
         *      path: string,
         *      text: string,
         *      label_theme: string,
         *      text_color: string,
         *      bg_style: number,
         *      bg_color: string,
         *      border_color: string
         *     },
         *     avatar_subscript: number,
         *     nickname_color: string,
         *     avatar_subscript_url: string
         *    }
         *  }[]}
         */
        let list = data.data.list
        if (list.length > 0 && list.length < this.total) {
          this.pn += 1
          for (; this.pn <= Math.ceil(this.total / this.ps); this.pn++) {
            await RList.Push()
            console.log(`正在获取第${this.pn}页关注列表`);
            /**
             * @type {{
             * code: number,
             * message: string,
             * ttl: number,
             * data: {
             *  list: {
             *    mid: number,
             *    attribute: number,
             *    mtime: number,
             *    tag: null,
             *    special: number,
             *    contract_info: {
             *     is_contractor: boolean,
             *     ts: number,
             *     is_contract: boolean,
             *     user_attr: number
             *    },
             *    uname: string,
             *    face: string,
             *    sign: string,
             *    face_nft: number,
             *    official_verify: {
             *     type: number,
             *     desc: string
             *    }
             *    vip: {
             *     vipType: number,
             *     vipDueDate: number,
             *     dueRemark: string,
             *     accessStatus: number,
             *     vipStatus: number,
             *     vipStatusWarn: string,
             *     themeType: number,
             *     label: {
             *      path: string,
             *      text: string,
             *      label_theme: string,
             *      text_color: string,
             *      bg_style: number,
             *      bg_color: string,
             *      border_color: string
             *     },
             *     avatar_subscript: number,
             *     nickname_color: string,
             *     avatar_subscript_url: string
             *    }
             *  }[],
             *  re_version: number,
             *  total: number
             * }
             * }}
             */
            const data1 = JSON.parse(await HTTPsend(this.followUrl, "GET", { "Referer": this.followReferer }))
            if (data1 && data1.code === 0) {
              list = list.concat(data1.data.list)
            }
            else return Promise.reject(data1)
          }
        }
        return list
      } else {
        return Promise.reject(data)
      }
    }
    async getFollowers() {
      this.pn = 1
      console.log(`正在获取第${this.pn}页粉丝列表`);
      /**
       * @type {{
       * code: number,
       * message: string,
       * ttl: number,
       * data: {
       *  list: {
       *    mid: number,
       *    attribute: number,
       *    mtime: number,
       *    tag: null,
       *    special: number,
       *    contract_info: {
       *     is_contractor: boolean,
       *     ts: number,
       *     is_contract: boolean,
       *     user_attr: number
       *    },
       *    uname: string,
       *    face: string,
       *    sign: string,
       *    face_nft: number,
       *    official_verify: {
       *     type: number,
       *     desc: string
       *    }
       *    vip: {
       *     vipType: number,
       *     vipDueDate: number,
       *     dueRemark: string,
       *     accessStatus: number,
       *     vipStatus: number,
       *     vipStatusWarn: string,
       *     themeType: number,
       *     label: {
       *      path: string,
       *      text: string,
       *      label_theme: string,
       *      text_color: string,
       *      bg_style: number,
       *      bg_color: string,
       *      border_color: string
       *     },
       *     avatar_subscript: number,
       *     nickname_color: string,
       *     avatar_subscript_url: string
       *    }
       *  }[],
       *  re_version: number,
       *  total: number
       * }
       * }}
       */
      const data = JSON.parse(await HTTPsend(this.fansUrl, "GET", { "Referer": this.fansReferer }))
      if (data && data.code === 0) {
        this.fansTotal = data.data.total
        /**
         * @type {{
         * mid: number,
         *    attribute: number,
         *    mtime: number,
         *    tag: null,
         *    special: number,
         *    contract_info: {
         *     is_contractor: boolean,
         *     ts: number,
         *     is_contract: boolean,
         *     user_attr: number
         *    },
         *    uname: string,
         *    face: string,
         *    sign: string,
         *    face_nft: number,
         *    official_verify: {
         *     type: number,
         *     desc: string
         *    }
         *    vip: {
         *     vipType: number,
         *     vipDueDate: number,
         *     dueRemark: string,
         *     accessStatus: number,
         *     vipStatus: number,
         *     vipStatusWarn: string,
         *     themeType: number,
         *     label: {
         *      path: string,
         *      text: string,
         *      label_theme: string,
         *      text_color: string,
         *      bg_style: number,
         *      bg_color: string,
         *      border_color: string
         *     },
         *     avatar_subscript: number,
         *     nickname_color: string,
         *     avatar_subscript_url: string
         *    }
         *  }[]}
         */
        let list = data.data.list
        if (list.length > 0 && list.length < this.fansTotal) {
          this.pn += 1
          let maxpn = Math.ceil(this.fansTotal / this.ps) > this.fansMaxpn ? this.fansMaxpn : Math.ceil(this.fansTotal / this.ps)
          for (; this.pn <= maxpn; this.pn++) {
            await RList.Push()
            console.log(`正在获取第${this.pn}页粉丝列表`);
            const data1 = JSON.parse(await HTTPsend(this.fansUrl, "GET", { "Referer": this.fansReferer }))
            if (data1 && data1.code === 0) {
              list = list.concat(data1.data.list)
            }
            else return Promise.reject(data1)
          }
        }
        return list
      } else {
        return Promise.reject(data)
      }
    }
    async getWhispers() {
      /**
       * @type {{
       * code: number,
       * message: string,
       * ttl: number,
       * data: {
       *  black: number,
       *  follower: number,
       *  following: number,
       *  mid: number,
       *  whisper: number
       * }
       * }}
       */
      const status = JSON.parse(await HTTPsend(this.stat, "GET", { "Referer": this.whispersReferer }))
      /**
       * @type {{
       * mid: number,
       *    attribute: number,
       *    mtime: number,
       *    tag: null,
       *    special: number,
       *    contract_info: {
       *     is_contractor: boolean,
       *     ts: number,
       *     is_contract: boolean,
       *     user_attr: number
       *    },
       *    uname: string,
       *    face: string,
       *    sign: string,
       *    face_nft: number,
       *    official_verify: {
       *     type: number,
       *     desc: string
       *    }
       *    vip: {
       *     vipType: number,
       *     vipDueDate: number,
       *     dueRemark: string,
       *     accessStatus: number,
       *     vipStatus: number,
       *     vipStatusWarn: string,
       *     themeType: number,
       *     label: {
       *      path: string,
       *      text: string,
       *      label_theme: string,
       *      text_color: string,
       *      bg_style: number,
       *      bg_color: string,
       *      border_color: string
       *     },
       *     avatar_subscript: number,
       *     nickname_color: string,
       *     avatar_subscript_url: string
       *    }
       *  }[]}
       */
      let list = []
      if (status.code === 0) {
        if (status.data.whisper > 0) {
          for (this.pn = 1; this.pn <= Math.ceil(status.data.whisper / this.ps); this.pn++) {
            console.log(`正在获取第${this.pn}页悄悄关注列表`);
            /**
             * @type {{
             * code: number,
             * message: string,
             * ttl: number,
             * data: {
             *  list: {
             *    mid: number,
             *    attribute: number,
             *    mtime: number,
             *    tag: null,
             *    special: number,
             *    contract_info: {
             *     is_contractor: boolean,
             *     ts: number,
             *     is_contract: boolean,
             *     user_attr: number
             *    },
             *    uname: string,
             *    face: string,
             *    sign: string,
             *    face_nft: number,
             *    official_verify: {
             *     type: number,
             *     desc: string
             *    }
             *    vip: {
             *     vipType: number,
             *     vipDueDate: number,
             *     dueRemark: string,
             *     accessStatus: number,
             *     vipStatus: number,
             *     vipStatusWarn: string,
             *     themeType: number,
             *     label: {
             *      path: string,
             *      text: string,
             *      label_theme: string,
             *      text_color: string,
             *      bg_style: number,
             *      bg_color: string,
             *      border_color: string
             *     },
             *     avatar_subscript: number,
             *     nickname_color: string,
             *     avatar_subscript_url: string
             *    }
             *  }[],
             *  re_version: number
             * }
             * }}
             */
            const data = JSON.parse(await HTTPsend(this.whispersUrl, "GET", { "Referer": this.whispersReferer }))
            if (data && data.code === 0) {
              list = list.concat(data.data.list)
            } else return Promise.reject(data)
          }
        }
        return list
      }
      else return Promise.reject(status)
    }
    /**
     * 检查是否已经关注
     * @param {number} uid 
     */
    async checkFollow(uid) {
      console.log(`正在检查${uid}是否已经关注`)
      this.checkuid = uid
      /**
       * @type {{
       *  code: number,
       *  message: string,
       *  ttl: number,
       *  data: {
       *   relation: {
       *    mid: number,
       *    attribute: number,
       *    mtime: number,
       *    tag: null,
       *    special: number,
       *   },
       *   be_relation: {
       *    mid: number,
       *    attribute: number,
       *    mtime: number,
       *    tag: null,
       *    special: number,
       *   }
       *  }
       * }}
       */
      const data = JSON.parse(await HTTPsend(this.relationUrl, "GET", { "Referer": this.relationReferer }))
      if (data && data.code === 0) {
        if (data.data.be_relation.mid === this.vmid) {
          return true
        }
        else return false
      }
      else return Promise.reject(data)
    }
  }

  const followingsDiff = async () => {
    if (bLab8A.data.follow.length === 0 && bLab8A.data.follow2.length === 0) {
      console.log("没有关注列表")
      bLab8A.data.follow = await BilibiliFollowChecker.getFollowings()
      if (bLab8A.data.follow.length === 0) {
        return { newfollow: [], follow: [], follow2: [], unfollowed: [], unfollowed2: [] };
      }
      bLab8A.data.follow2 = bLab8A.data.follow.filter(item => {
        return item.attribute === 6
      })
      bLab8A.save(bLab8A.data)
      return { newfollow: bLab8A.data.follow, follow: bLab8A.data.follow, follow2: bLab8A.data.follow2, unfollowed: [], unfollowed2: [] }
    }
    else {
      let list = await BilibiliFollowChecker.getFollowings()
      if (list.length === 0) {
        return { newfollow: [], follow: [], follow2: [], unfollowed: bLab8A.data.follow, unfollowed2: [] }
      }
      let follow = []
      let follow2 = []
      let wht = []
      for (let i = 0; i < list.length; i++) {
        switch (list[i].attribute) {
          case 6:
            follow.push(list[i])
            follow2.push(list[i])
            break;
          case 2:
            follow.push(list[i])
            break;
          default:
            console.log(list[i].attribute)
            wht.push(list[i])
            break;
        }
      }
      if (wht.length > 0) {
        console.log(`有${wht.length}个未知类型的关注`)
      }
      console.log(follow.length)
      let newfollow = follow.filter(item => {
        return !bLab8A.data.follow.some(item2 => {
          return item.mid === item2.mid
        })
      })
      // for (let i = 0; i < follow.length; i++) {
      //     let isExist = false
      //     for (let j = 0; j < bLab8A.data.follow.length; j++) {
      //         if (follow[i].mid === bLab8A.data.follow[j].mid) {
      //             isExist = true
      //             break
      //         }
      //     }
      //     if (!isExist) {
      //         newfollow.push(follow[i])
      //     }
      // }
      let unfollowed = bLab8A.data.follow.filter(item => {
        return !follow.some(item2 => {
          return item.mid === item2.mid
        })
      })
      // for (let i = 0; i < bLab8A.data.follow.length; i++) {
      //     let isExist = false
      //     for (let j = 0; j < follow.length; j++) {
      //         if (bLab8A.data.follow[i].mid === follow[j].mid) {
      //             isExist = true
      //             break
      //         }
      //     }
      //     if (!isExist) {
      //         unfollowed.push(bLab8A.data.follow[i])
      //     }
      // }
      let unfollowed2 = bLab8A.data.follow2.filter(item => {
        return !follow2.some(item2 => {
          return item.mid === item2.mid
        })
      })
      // for (let i = 0; i < bLab8A.data.follow2.length; i++) {
      //     let isExist = false
      //     for (let j = 0; j < follow2.length; j++) {
      //         if (bLab8A.data.follow2[i].mid === follow2[j].mid) {
      //             isExist = true
      //             break
      //         }
      //     }
      //     if (!isExist) {
      //         unfollowed2.push(bLab8A.data.follow2[i])
      //     }
      // }
      bLab8A.data.follow = follow
      bLab8A.data.follow2 = follow2
      bLab8A.data.unfollowed.concat(unfollowed)
      // 如果取消关注的人重新关注了，则把他从unfollowed中移除
      // 你觉得他们还会回来吗？嗯？
      bLab8A.data.unfollowed = bLab8A.data.unfollowed.filter(item => {
        return !follow.some(item2 => {
          return item.mid === item2.mid
        })
      })
      bLab8A.data.unfollowed2.concat(unfollowed2)
      bLab8A.data.unfollowed2 = bLab8A.data.unfollowed2.filter(item => {
        return !follow2.some(item2 => {
          return item.mid === item2.mid
        }) || !follow.some(item2 => {
          return item.mid === item2.mid
        })
      })
      bLab8A.save(bLab8A.data)
      return { newfollow, follow, follow2, unfollowed, unfollowed2 }
    }
  }

  const fansCheck = async () => {
    console.log("开始检查粉丝")
    console.log("由于粉丝列表最多只能获取到50页，所以这里只检查前50页")
    if (bLab8A.data.fans.length === 0) {
      bLab8A.data.fans = await BilibiliFollowChecker.getFollowers()
      bLab8A.save(bLab8A.data)
      return { newfans: bLab8A.data.fans, fans: bLab8A.data.fans }
    }
    else {
      let fans = await BilibiliFollowChecker.getFollowers()
      let newfans = []
      // 与bLab8A.data.fans比较，获取新增的粉丝
      newfans = fans.filter(item => {
        return !bLab8A.data.fans.some(item2 => {
          return item.mid === item2.mid
        })
      })
      // 将fans加入到bLab8A.data.fans中，同时避免重复加入
      for (let i = 0; i < fans.length; i++) {
        let isExist = false
        for (let j = 0; j < bLab8A.data.fans.length; j++) {
          if (fans[i].mid === bLab8A.data.fans[j].mid) {
            isExist = true
            break
          }
        }
        if (!isExist) {
          bLab8A.data.fans.push(fans[i])
        }
      }
      // for (let i = 0; i < fans.length; i++) {
      //     let isExist = false
      //     for (let j = 0; j < bLab8A.data.fans.length; j++) {
      //         if (fans[i].mid === bLab8A.data.fans[j].mid) {
      //             isExist = true
      //             break
      //         }
      //     }
      //     if (!isExist) {
      //         newfans.push(fans[i])
      //     }
      // }
      bLab8A.save(bLab8A.data)
      return { newfans, fans: bLab8A.data.fans }
    }
  }

  const whispersCheck = async () => {
    console.log("开始检查悄悄关注")
    if (bLab8A.data.whispers.length === 0) {
      bLab8A.data.whispers = await BilibiliFollowChecker.getWhispers()
      // bLab8A.data.whispers.map(whispers => {
      //   console.log(whispers.mid, whispers.uname, whispers.attribute)
      // })
      bLab8A.save(bLab8A.data)
      return { newwhispers: bLab8A.data.whispers, whispers: bLab8A.data.whispers }
    }
    else {
      let whispers = await BilibiliFollowChecker.getWhispers()
      let newwhispers = []
      // 与bLab8A.data.whispers比较，获取新增的悄悄关注
      newwhispers = whispers.filter(item => {
        return !bLab8A.data.whispers.some(item2 => {
          return item.mid === item2.mid
        })
      })
      // 将whispers加入到bLab8A.data.whispers中，同时避免重复加入
      for (let i = 0; i < whispers.length; i++) {
        let isExist = false
        for (let j = 0; j < bLab8A.data.whispers.length; j++) {
          if (whispers[i].mid === bLab8A.data.whispers[j].mid) {
            isExist = true
            break
          }
        }
        if (!isExist) {
          bLab8A.data.whispers.push(whispers[i])
        }
      }
      // bLab8A.data.whispers.map(whispers => {
      //   console.log(whispers.mid, whispers.uname, whispers.attribute)
      // })
      bLab8A.save(bLab8A.data)
      return { newwhispers, whispers: bLab8A.data.whispers }
    }
  }

  const whispersFollowCheck = async () => {
    for(let i = 0; i < bLab8A.data.whispers.length; i++) {
      const whisper = bLab8A.data.whispers[i]
      await RList.Push()
      await RList.Push()
      const isFollowed = await BilibiliFollowChecker.checkFollow(whisper.mid)
      console.log(whisper.mid, whisper.uname, whisper.attribute, isFollowed ? "已关注我" : "未关注我")
      if (isFollowed) {
        // 将whisper加入到bLab8A.data.whispersfollow中，同时避免重复加入
        let isExist = false
        for (let j = 0; j < bLab8A.data.whispersfollow.length; j++) {
          if (whisper.mid === bLab8A.data.whispersfollow[j].mid) {
            isExist = true
            break
          }
        }
        if (!isExist) {
          bLab8A.data.whispersfollow.push(whisper)
        }
      }
    }
    bLab8A.save(bLab8A.data)
    return "悄悄关注检查完毕"
  }

  GM_registerMenuCommand("获取关注差异", () => { followingsDiff().then(console.log).catch(console.error) })
  GM_registerMenuCommand("检查粉丝", () => { fansCheck().then(console.log).catch(console.error) })
  GM_registerMenuCommand("更新悄悄关注", () => { whispersCheck().then(console.log).catch(console.error) })
  GM_registerMenuCommand("检查悄悄关注的人", () => { whispersFollowCheck().then(console.log).catch(console.error) })
})()
