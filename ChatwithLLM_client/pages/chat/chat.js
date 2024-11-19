// pages/news/news.js
const util = require('../../utils/util.js')

Page({

    /**
     * 页面的初始数据
     */
    data: {
        messages: [],
        response: "",
        userid:"",
        input:"",
        socketTask: null,
        scrollIntoView:""
    },
  
    bindKeyInput(e){
        let that = this
        console.log(e.detail.value);
        that.setData({
            input:e.detail.value
        })
    },
  
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function () {
        this.initWebSocket();
    },
  
    initWebSocket: function () {
        const that = this;
        const wsUrl = 'ws://localhost:8080/ws'; // 替换为你的 WebSocket 服务器地址
        const socketTask = wx.connectSocket({
            url: wsUrl,
            success: data => {
                that.setData({ socketOpen: true });
                console.log('socket 连接成功', data);
            },
            fail: data => {
                console.error('socket 连接失败', data);
            },
        });
  
        socketTask.onError(function (res) {
            console.error('WebSocket 错误：', res);
        });

        socketTask.onMessage(function (res) {
            console.log('收到服务器内容：', res.data);

            const lines = res.data.split('\n').filter(line => line.trim() !== '');
            lines.forEach(line => {
                try {
                    const response = JSON.parse(line);
                    if (response.code === 201) {
                        console.log("用户id:", response.userid)
                        that.setData({userid: response.userid});
                    } else {
                        const message = JSON.parse(response.message)
                        if (!message.done) {
                            that.setData({
                                response: that.data.response + message.message.content,
                                scrollIntoView: `msg-${that.data.messages.length+1}`
                            });
                        } else {
                            console.log("结束")
                            // const currentTime = new Date().toLocaleTimeString();
                            const currentTime = Date.now();
                            const newbotMessage = { from: 'bot', text: that.data.response, avatar: "/avatar/robot.png", time: currentTime };
                            that.saveChatRecord(newbotMessage)
                            that.setData({
                                messages: [...that.data.messages, newbotMessage],
                                input: '',
                                response: '',
                                scrollIntoView: `msg-${that.data.messages.length+1}`
                              });
                        }
                    }
                } catch (error) {
                    console.error('解析 JSON 失败', error);
                }
            });
        });

        socketTask.onOpen(function (res) {
            console.log('WebSocket 已连接');
            that.setData({socketTask:socketTask});
        });

    },
  
    sendMessage: function () {
        const message = this.data.input.trim();
        if (message) {
            // const currentTime = new Date().toLocaleTimeString();
            const currentTime = Date.now();
            const newMessage = { from: 'user', text: message, avatar: "/avatar/user.png", time: currentTime };
            this.saveChatRecord(newMessage)
            this.setData({
                messages: [...this.data.messages, newMessage],
                responser: '',
                scrollIntoView: `msg-${this.data.messages.length}`
            });
            console.log("发送",util.formatTime(new Date()))

            if (this.data.socketTask && this.data.socketTask.readyState === 1 && this.data.userid) {
                // 发送请求到服务器，开始流式输出
                this.data.socketTask.send({
                    data: JSON.stringify({
                        "userid": this.data.userid,
                        "model": "qwen2.5:7b",
                        "messages": [
                        {
                            "role": "user",
                            "content": this.data.input,
                        }
                        ]
                    })
                });
            } else {
                console.error('WebSocket 连接未准备好');
            }
        }
    },

    closeWebSocket: function () {
        if (this.data.socketTask) {
        this.data.socketTask.close({
            success: function (res) {
                console.log('WebSocket 关闭成功');
            },
            fail: function (res) {
                console.error('WebSocket 关闭失败', res);
            }
        });
        }
    },

    // 存储单条聊天记录
    saveChatRecord: function (record) {
        wx.getStorage({
        key: util.formatTime(new Date()), // 键名
        success: function(res) {
            // 如果已经存在聊天记录，则获取已有记录并添加新记录
            let chatRecords = res.data || [];
            chatRecords.push(record);
            wx.setStorage({
            key: util.formatTime(new Date()),
            data: chatRecords,
            success: function() {
                console.log('聊天记录已保存',util.formatTime(new Date()));
            }
            });
        },
        fail: function() {
            // 如果没有找到现有记录，则直接保存新记录
            wx.setStorage({
            key: util.formatTime(new Date()),
            data: [record],
            success: function() {
                console.log('首次保存聊天记录',util.formatTime(new Date().toLocaleTimeString()));
            }
            });
        }
        });
    },
  
    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady() {
  
    },
  
    /**
     * 生命周期函数--监听页面显示
     */
    onShow() {
  
    },
  
    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide() {
  
    },
  
    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload() {
        this.closeWebSocket();
    },
  
    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh() {
  
    },
  
    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom() {
  
    },
  
    /**
     * 用户点击右上角分享
     */
    onShareAppMessage() {
  
    }
  });