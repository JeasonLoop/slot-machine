/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useRef } from 'react';
import './index.css'; // 确保引入了相应的 CSS 文件

const ITEM_HEIGHT = 90
let overTimer = null

function SlotMachine() {
  // --- 此处的奖品数据为默认写好，如果模拟真实情况则是通过接口或者props接收奖品列表之后，处理成下述的格式
  const [slotsData, setSlotsData] = useState([
    { name: '1鼠标', isActived: 0 },
    { name: '2键盘', isActived: 0 },
    { name: '3笔记本', isActived: 0 },
    { name: '4西瓜', isActived: 0 },
    { name: '5苹果', isActived: 0 },
    { name: '6火龙果', isActived: 0 },
    { name: '7汽车', isActived: 0 },
    { name: '8手机', isActived: 0 },
    { name: '9游戏机', isActived: 0 }
  ]);

  const [slots, setSlots] = useState([
    { title: "组1", trans: 0, items: [] },
    { title: "组2", trans: 0, items: [] },
    { title: "组3", trans: 0, items: [] }
  ]);
  const [slotsOpts, setSlotsOpts] = useState(null);
  const animationFrameId = useRef(null); // 用于存储动画帧请求的 ID
  const slotsStartedAt = useRef(null);
  const animateDuration = 5; // 滚动时长：秒

  const [isRolling, setIsRolling] = useState(false)
  const [timeCount, setTimeCount] = useState(0) // 超时计算
  const [nextRoundFactor, setNextRoundFactor] = useState(0); // 转动因子

  const [isRandom, setIsRandom] = useState(false)


  // 数组洗牌
  const shuffleArray = (array) => {
    const newArray = array.slice(); // 克隆原始数组，以避免修改原数组
    for (let i = newArray.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1)); // 生成 0 到 i 之间的随机数
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]]; // 交换元素位置
    }
    return newArray;
  };

  // 初始化slot组数据
  const initSlots = () => {
    const updatedSlots = slots.map((slot) => {
      const items = isRandom ? shuffleArray(slotsData) : slotsData;
      return {
        ...slot,
        items,
      };
    });
    setSlots(updatedSlots);
  };

  // 是否要随机初始数组
  const changeRandomVersion = () => {
    if (isRolling) return
    if (isRandom) {
      initSlots()
    }
    setIsRandom(preState => !preState)
  }

  // 停止滚动并且生成奖品
  const stop = (prizeName) => {

    // 模拟请求后台中奖返回
    const resultIndex = Math.floor(Math.random() * slotsData.length);
    const resultName = prizeName || slotsData[resultIndex].name

    // ------- 这一步只是为了最后动画结束能显示结果，实际业务中可以灵活调整
    const newSlotsData = slotsData.map((item) => {
      return {
        ...item,
        isActived: item.name === resultName ? 1 : 0
      }
    })
    setSlotsData(newSlotsData)
    // -------


    const updatedSlotsOpts = slots.map((slot, i) => {
      const { items } = slot || {};
      let choice = items.findIndex((item) => item.name === resultName);
      if (resultName === '谢谢参与') {
        choice = i;
      }
      return {
        finalPos: choice * ITEM_HEIGHT, // 根据实际高度变化
        startOffset: 8000 + Math.random() * 500 + i * 1600,
        height: items.length * ITEM_HEIGHT,
        duration: animateDuration * 1000 + i * 1000,
        isFinished: false,
      };
    });

    setSlotsOpts(updatedSlotsOpts);
    setIsRolling(false);
  }

  // 开始滚动
  const roll = () => {
    initSlots();
    setTimeCount(0)
    setIsRolling(true)
    const updatedSlotsOpts = slots.map((slot, i) => {
      return {
        finalPos: 0, // 根据实际高度变化
        startOffset: 8000 + Math.random() * 500 + i * 1600,
        height: slot.items.length * ITEM_HEIGHT,
        duration: animateDuration * 1000 + i * 1000,
        isFinished: false
      };
    });

    setSlotsOpts(updatedSlotsOpts);
    slotsStartedAt.current = Date.now();
  };

  // 奖品数据初始化
  useEffect(() => {
    initSlots();
  }, [isRandom]);


  // 转动超时处理
  useEffect(() => {
    if (!isRolling) return
    if (timeCount >= 5) {
      stop('谢谢参与')
    }
    overTimer = setTimeout(() => {
      setTimeCount(p => p + 1)
    }, 1000);

    return () => {
      if (overTimer) {
        clearTimeout(overTimer)
      }
    }
  }, [isRolling, timeCount])


  // 动画处理逻辑
  useEffect(() => {
    if (!slotsOpts) {
      return;
    }

    const animate = (deltatime) => {
      setNextRoundFactor(preCount => preCount + 0.5); // 线性增长加速

      let timeDiff = Date.now() - slotsStartedAt.current;
      // 正常手动停止的时限数值
      timeDiff = isRolling ? timeDiff - nextRoundFactor * 1000 : timeDiff;

      // 超时停止的特殊处理
      if (timeCount >= 5 && !isRolling) {
        timeDiff = timeDiff - 2500
      }

      let allFinished = true; // 判断是否全部滚动完成
      const updatedSlots = slots.map((slot, i) => {
        const opt = slotsOpts[i];
        const timeRemaining = opt.duration - timeDiff;

        if (timeRemaining > 0) {
          allFinished = false; // 标记动画未结束
          const power = 3;
          const offset = (timeRemaining ** power / opt.duration ** power) * opt.startOffset;
          const pos = -1 * Math.floor((offset + opt.finalPos) % opt.height);
          return { ...slot, trans: pos };
        }
        return { ...slot, trans: -opt.finalPos }; // 动画结束，设置最终位置
      });

      if (!allFinished) {
        setSlots(updatedSlots);
        animationFrameId.current = requestAnimationFrame(animate);
      } else {
        // 动画结束，清理状态 打开弹窗
        if (timeCount >= 5 || !isRolling) {
          const resultName = slotsData.find(item => item.isActived === 1)?.name || '谢谢参与'
          alert(`恭喜获得：${resultName}`);
        }
        setSlotsOpts(null);
        cancelAnimationFrame(animationFrameId.current); // 取消动画帧请求
      }
    };

    animationFrameId.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId.current); // 清理动画帧请求
  }, [slotsOpts, slotsData, slots, isRolling]);

  // 渲染奖品列
  const renderSlosColumns = () => {
    return (
      <>
        {
          slots.map((slot, i) => (
            <div key={i} className="slot_box">
              <div className={`slot_box_inner ${slotsOpts ? 'move' : ''}`}>
                <div className="slot_items" style={{ transform: `translateY(${slot.trans}px)` }}>
                  {
                    slot.items.map((item, index) => (
                      <div key={index} className="slot_item">{item.name}</div>
                    ))
                  }
                  <div className="slot_item slot_item_copy">{slot.items[0]?.name}</div>
                </div>
              </div>
            </div>
          ))
        }
      </>
    )
  }

  return (
    <div className="slots_box">
      {renderSlosColumns()}
      <button onClick={() => roll()} className="btn">开始抽奖</button>
      <button onClick={() => stop()} className="btn">停止抽奖</button>
      <button onClick={changeRandomVersion} className="btn">
        {isRandom ? '不随机初始数组' : '随机初始数组'}
      </button>
    </div>
  );
}

export default SlotMachine
