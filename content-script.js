const wrapperNode = document.querySelector('.entry-list-wrap')
// 列表监视器
let listObserver = null
/** 阈值色相 */
const HUE = 11
/** 限制阈值 */
const LIMIT_THRESHOLD = 3
let entryNodeList = null

// 容器监视器
const wrapObserver = new MutationObserver((mutationList) => {
  mutationList.forEach((mutation) => {
    const addedNodes = mutation.addedNodes
    if (addedNodes.length > 0 && addedNodes[0].className === 'entry-list list') {
      entryNodeList = addedNodes[0]
      const articleList = entryNodeList.querySelectorAll('.entry')
      articleList.forEach(setPriority);
      entryListResort(entryNodeList.childNodes)
      // 首次容器内容变化后出现列表, 后续监视列表变化
      listObserveStart()
    } else if (mutation.removedNodes.length > 0 && mutation.removedNodes[0].className === 'entry-list list') {
      listObserveStop()
    }
  })
})
wrapObserver.observe(wrapperNode, { childList: true })

/** 字符串数字转数字 "1.2w" ==> 12000 */
function formatStrToNumber_(strNum) {
  if (strNum.includes('w')) {
    return parseFloat(strNum) * 10000
  } else {
    return parseFloat(strNum)
  }
}

/** 开始监视列表 */
function listObserveStart() {
  listObserver = new MutationObserver((mutationList) => {
    const newItemList = []
    mutationList.forEach((mutation) => {
      const addedNodes = mutation.addedNodes
      if (addedNodes.length > 0 && addedNodes[0].className === 'item entry-list-enter entry-list-enter-active') {
        setPriority(addedNodes[0])
        newItemList.push(addedNodes[0])
      }
    })
    // 暂时解除监视, 防止重排后触发变动逻辑
    listObserver.disconnect()
    entryListResort(newItemList)
    listObserver.observe(entryNodeList, { childList: true })
  })
  listObserver.observe(entryNodeList, { childList: true })
}

function listObserveStop() {
  listObserver && listObserver.disconnect()
}

/** 插入权重节点到一个文章节点 */
function setPriority(itemNode) {
  const viewNode = itemNode.querySelector('.view')
  const likeNode = itemNode.querySelector('.like')
  if (viewNode && likeNode) {
    const viewNum = formatStrToNumber_(viewNode.innerText)
    const likeNum = formatStrToNumber_(likeNode.innerText)
    if (viewNum && likeNum) {
      const titleNode = itemNode.querySelector('.title')
      const ratio = (likeNum * 100 / viewNum).toFixed(2)
      const colorRatio = ratio > LIMIT_THRESHOLD ? '100%' : `${(ratio / LIMIT_THRESHOLD).toFixed(2) * 100}%`
      titleNode.innerHTML = `<span class="item-priority" style="color:hsl(${HUE} ${colorRatio} 50%);">[${ratio}]</span>${titleNode.innerHTML}`
    }
  }
}

/** 列表容器按照文章节点权重排序 */
function entryListResort(nodeList) {
  const fragment = document.createDocumentFragment();
  // 处理无法排序的节点, 追加到末尾
  const articleList = [...nodeList]
  const sortableList = []
  const unSortableList = []
  articleList.forEach(node => {
    if (node.querySelector('.item-priority')) {
      sortableList.push(node)
    } else {
      unSortableList.push(node)
    }
  })
  sortableList
    .sort(diffPriority)
    .concat(unSortableList)
    .forEach(node => fragment.appendChild(node))
  entryNodeList.appendChild(fragment)
}

/** 返回比较两个文章节点的权重 */
function diffPriority(preNode, nextNode) {
  const prePriorityNode = preNode.querySelector('.item-priority')
  const prePriority = prePriorityNode ? prePriorityNode.innerText.replace('[', '').replace(']', '') : undefined
  const nextPriorityNode = nextNode.querySelector('.item-priority')
  const nextPriority = nextPriorityNode ? nextPriorityNode.innerText.replace('[', '').replace(']', '') : undefined
  const diff = nextPriority - prePriority
  return isNaN(diff) ? 1 : diff
}