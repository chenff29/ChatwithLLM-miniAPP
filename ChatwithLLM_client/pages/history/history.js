// logs.js
const util = require('../../utils/util.js')

Page({
    data: {
        chatHistory: [],
        data: []
    },

    onLoad() {
        wx.getStorageInfo({
            success: res => {
                this.setData({
                    chatHistory: res.keys
                })
                console.log(res.keys)
                // console.log(res.currentSize)
                // console.log(res.limitSize)
            }
        })
    },

    onUnload() {
        console.log("卸载页面")
        const now = Date.now();
        const expirationTime = 7 * 24 * 60 * 60 * 1000; // 24小时
        this.data.chatHistory.forEach(key => {
            console.log("key",key)
            wx.getStorage({
                key: key,
                success: res=> {
                    // 成功获取到数据
                    console.log('获取到的数据:', res.data);
                    const data = res.data
                    const timeDifference = now - data[0].time;
                    console.log("时间差:",timeDifference)
                    if (timeDifference > expirationTime) {
                        wx.removeStorage({
                        key: key,
                        success: function () {
                            console.log(`过期数据 ${key} 已删除`);
                        },
                        fail: function (err) {
                            console.error(`删除过期数据 ${key} 失败:`, err);
                        }
                        });
                    }
                },
                fail: function(err) {
                    // 获取数据失败
                    console.error('获取数据失败:', err);
                },
                complete: function(res) {
                    // 无论成功或失败都会执行的回调
                    console.log('操作完成');
                }
            });
        });
    }
})
