// pages/news/news.js
Page({

    /**
     * 页面的初始数据
     */
    data: {
      response: "",
      answer:"",
      socketOpen: false,
      socketTask: null
    },
  
    bindKeyInput(e){
      let that = this
      console.log(e.detail.value);
      that.setData({
          answer:e.detail.value
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
            // protocols: ['chat'],
            success: data => {
                that.setData({ socketOpen: true });
                console.log('socket 连接成功', data);
                //this.initSocketListener();
            },
            fail: data => {
                console.error('socket 连接失败', data);
            },
        });
  
        socketTask.onError(function (res) {
            console.error('WebSocket 错误：', res);
        });
        
        // OnMessage1
        // socketTask.onMessage((res) => {
        //     const lines = res.data.split('\n').filter(line => line.trim() !== '');
        //     lines.forEach(line => {
        //     try {
        //         const message = JSON.parse(line);
        //         if (!message.done) {
        //         this.setData({
        //             response: this.data.response + message.message.content
        //         });
        //         }
        //     } catch (error) {
        //         console.error('解析 JSON 失败', error);
        //     }
        //     });
        // });

        socketTask.onMessage(function (res) {
            console.log('收到服务器内容：', res.data);
            // that.setData({
            //     response: res.data
            // });
            const lines = res.data.split('\n').filter(line => line.trim() !== '');
            lines.forEach(line => {
                try {
                    const message = JSON.parse(line);
                    if (!message.done) {
                        that.setData({
                            response: that.data.response + message.message.content
                        });
                    }
                } catch (error) {
                    console.error('解析 JSON 失败', error);
                }
            });
        });

        socketTask.onOpen(function (res) {
            console.log('WebSocket 已连接');
            that.setData({socketTask:socketTask});
            // 发送一条消息给服务器
            // socketTask.send({
            //     data: JSON.stringify({ text: 'Hello from WeChat Mini Program' }),
            // });
        });
  
        // socketTask.onClose(function (res) {
        //     console.log('WebSocket 已关闭');
        //     that.setData({ socketOpen: false });
        // });
    },
  
    sendMessage: function () {
        // this.data.socketTask.send({
        //     data: JSON.stringify({ text: '11111' }),
        // });
        console.log("发送")
        this.setData({
            response: ""
        });

        if (this.data.socketTask && this.data.socketTask.readyState === 1) {
            // 发送请求到服务器，开始流式输出
            this.data.socketTask.send({
                data: JSON.stringify({
                    "model": "qwen2.5:7b",
                    "messages": [
                      {
                        "role": "user",
                        "content": this.data.answer,
                      }
                    ]
                })
            });

            // this.data.socketTask.send({
            //     data: JSON.stringify({ text: '1' }),
            // });
        } else {
            console.error('WebSocket 连接未准备好');
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
  })