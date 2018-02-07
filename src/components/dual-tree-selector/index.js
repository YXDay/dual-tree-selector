/**
 * @file 双树选择器
 * @author daiyanxu@baidu.com
 * @time 2017-12-13
 */
import {Button} from 'element-ui';
import template from './index.tpl.html';
import './index.less';
export default {
    data() {
        return {
            targetTreeData: [],
            // 目标树节点展开状态
            targetTreeExpandStauts: {}
        };
    },
    props: {
        sourceTreeData: {
            default() {
                return [
                    {
                        id: '0',
                        label: '一级 1',
                        added: false,
                        children: [{
                            id: '0-0',
                            label: '二级 1-1',
                            added: false,
                            children: [{
                                id: '0-0-0',
                                label: '三级 1-1-1',
                                added: false
                            }, {
                                id: '0-0-1',
                                label: '三级 1-1-2',
                                added: false
                            }]
                        }]
                    }
                ];
            }
        },
        // 指定节点标签为节点对象的某个属性值
        // 指定子树为节点对象的某个属性值
        defaultProps: {
            default() {
                return {
                    children: 'children',
                    label: 'label'
                };
            }
        }
    },
    template,
    computed: {
        chosenAmount() {
            return this.getLeavesAmount(this.targetTreeData);
        },
        totalAmount() {
            return this.getLeavesAmount(this.sourceTreeData);
        }
    },
    methods: {

        /**
        * 渲染源树节点
        *
        * @param {Function} h render函数
        * @param {Object} node 要添加的节点
        * @param {Object} data 要添加的节点数据
        * @param {Object} store element提供的API
        * @return {Object} VNode
        */
        renderSourceTreeContent(h, {node, data, store}) {
            this.validateFunctionInput(
                'renderSourceTreeContent',
                {value: h, type: 'function'},
                {value: node, type: 'object'},
                {value: data, type: 'object'},
                {value: store, type: 'object'}
            );
            return (
            <span>
                <span>
                    <span>{node.label}</span>
                </span>
                <span style="float: right; margin-right: 20px">
                    <Button size="mini" on-click={() => {
                        this.addNode({node, data, store});
                    }}>
                        {data.added ? '✓' : '+'}
                    </Button>
                </span>
            </span>);
        },

        /**
        * 渲染目标树节点
        *
        * @param {Function} h render函数
        * @param {Object} node 要添加的节点
        * @param {Object} data 要添加的节点数据
        * @param {Object} store element提供的API
        * @return {Object} VNode
        */
        renderTargetTreeContent(h, {node, data, store}) {
            this.validateFunctionInput(
                'renderTargetTreeContent',
                {value: h, type: 'function'},
                {value: node, type: 'object'},
                {value: data, type: 'object'},
                {value: store, type: 'object'}
            );
            return (
            <span>
                <span>
                    <span>{node.label}</span>
                </span>
                <span style="float: right; margin-right: 20px">
                    <Button
                    size="mini"
                    on-click={() => {
                        this.delNode({node, data, store});
                    }}
                    >×</Button>
                </span>
            </span>);
        },

        /**
        * 自源树向目标树添加节点
        *
        * @param {Object} node 要添加的节点
        * @param {Object} data 要添加的节点数据
        * @param {Object} store element提供的API
        */
        addNode({node, data, store}) {
            this.validateFunctionInput(
                'addNode',
                {value: node, type: 'object'},
                {value: data, type: 'object'},
                {value: store, type: 'object'}
            );
            this.saveTargetTreeExpandStauts(this.$refs.targetTree.root);
            // 选中当前节点
            store.setChecked(data, true);
            // 递归选中当前节点的所有祖先节点
            let parent = node.parent;
            while (parent) {
                store.setChecked(parent.data, true);
                parent = parent.parent;
            }
            let checkedDataArr = this.getCheckedDataArr(store);
            this.mergeData(this.targetTreeData, checkedDataArr);
            store.setChecked(checkedDataArr[0].id, false, true);
            this.setAddStatus([data], true);
            this.targetTreeData.sort((prev, next) => prev.id - next.id);
            this.$nextTick(() => {
                this.keepTargetTreeExpandStauts(this.$refs.targetTree.root);
                this.copyExpandedStatus(node);
            });
        },

        /**
        * 自目标树删除节点
        *
        * @param {Object} node 要删除的节点
        * @param {Object} data 要删除的节点数据
        * @param {Object} store element提供的API
        */
        delNode({node, data, store}) {
            this.validateFunctionInput(
                'delNode',
                {value: node, type: 'object'},
                {value: data, type: 'object'},
                {value: store, type: 'object'}
            );
            this.saveTargetTreeExpandStauts(this.$refs.targetTree.root);
            store.setChecked(data, true);
            this.delData(this.targetTreeData, this.getCheckedDataArr(store)[0]);
            this.setAddStatus([this.getNodeByKey(this.$refs.sourceTree.root, data.id).data], false);
            this.$nextTick(() => {
                this.keepTargetTreeExpandStauts(this.$refs.targetTree.root);
            });

        },

        /**
        * 以传入节点为根节点进行遍历
        * 广度优先遍历.
        *
        * @param {Object} root 目标根节点
        * @param {funtion} func 第三方函数，用于判断停止时机，以及对节点进行处理
        * @return {Object} 目标node
        */
        traverseNode(root, func) {
            this.validateFunctionInput(
                'traverseNode',
                {value: root, type: 'object'},
                {value: func, type: 'function'}
            );
            let stack = [root];
            while (stack.length !== 0) {
                let node = stack.pop();
                if (func(node)) {
                    return node;
                }
                if (node.childNodes) {
                    stack.push.apply(stack, node.childNodes);
                }
            }
            return {};
        },

        /**
        * 根据key值获取node
        * 广度优先遍历, 可以传入任意节点.
        *
        * @param {Object} root 目标根节点
        * @param {string} key 目标key值
        * @return {Object} 目标node
        */
        getNodeByKey(root, key) {
            this.validateFunctionInput(
                'getNodeByKey',
                {value: root, type: 'object'},
                {value: key, type: 'string'}
            );
            return this.traverseNode(root, node => node.key === key);
        },

        /**
        * 获取选中的节点
        * element在获取特定节点方面没有暴露合适的API
        * element可以方便地获取被选中节点的 API
        * 故本组件在取特定节点时采用先将其选中，然后获取之，然后取消选中的方式
        *
        * @param {Object} store element提供的API
        * @return {Object} 目标node
        */
        getCheckedDataArr(store) {
            this.validateFunctionInput(
                'getCheckedDataArr',
                {value: store, type: 'object'}
            );
            let checkedData = JSON.parse(JSON.stringify(store.getCheckedNodes()));
            for (let i = checkedData.length - 1; i > 0; i--) {
                checkedData[i - 1].children = [checkedData[i]];
            }
            // 返回一个数组,方便递归
            return [checkedData[0]];
        },

        /**
        * 递归设置源树节点的状态标志
        * 该节点未被添加到目标树，显示+
        * 该节点已被添加到目标树，显示对号
        *
        * @param {Array} dataArr  要设置的节点
        * @param {boolean} added  设置状态
        */
        setAddStatus(dataArr, added) {
            this.validateFunctionInput(
                'setAddStatus',
                {value: dataArr},
                {value: added, type: 'boolean'}
            );
            if (!Array.isArray(dataArr)) {
                return;
            }
            dataArr.forEach(data => {
                data.added = added;
                this.setAddStatus(data.children, added);
            });
        },

        /**
        * 源树数据递归合入目标树
        *
        * @param {Array} targetArr 右树data数组
        * @param {Array} objArr 左树被选中的data数组
        */
        mergeData(targetArr, objArr) {
            this.validateFunctionInput(
                'mergeData',
                {value: targetArr, type: 'array'},
                {value: objArr, type: 'array'}
            );
            // 一重遍历
            objArr.forEach((obj, objIndex) => {
                // 二重遍历
                let index = targetArr.findIndex(value => value.id === obj.id);
                if (index !== -1) {
                    // 事实上不存在其他情况
                    if (targetArr[index].children && objArr[objIndex].children) {
                        targetArr = targetArr[index].children;
                        objArr = objArr[objIndex].children;
                        // 递归
                        this.mergeData(targetArr, objArr);
                    }
                }
                else {
                    targetArr.push(obj);
                }
            });
        },

        /**
        * 目标树递归删除
        *
        * @param {Array} targetArr 右树data数组
        * @param {Object} delObj 需要被删除的数据
        */
        delData(targetArr, delObj) {
            this.validateFunctionInput(
                'delData',
                {value: targetArr, type: 'array'},
                {value: delObj, type: 'object'}
            );
            let i = targetArr.length;
            while (i--) {
                if (targetArr[i].id === delObj.id) {
                    targetArr.splice(i, 1);
                    return;
                }
                if (Array.isArray(targetArr[i].children)) {
                    this.delData(targetArr[i].children, delObj);
                }
            }
        },

        /**
        * 源树全部添加到目标树
        *
        */
        addTotal() {
            this.targetTreeData = JSON.parse(JSON.stringify(this.sourceTreeData));
            this.$refs.sourceTree.root.childNodes.forEach(childNode => {
                this.$nextTick(() => {
                    this.copyExpandedStatus(childNode);
                });
            });
        },

        /**
        * 目标树全部删除
        *
        */
        delTotal() {
            this.targetTreeData = [];
        },

        /**
        * 递归获取叶子节点数目
        *
        * @param {Array} tree 树
        * @return {number} 叶子节点数目
        */
        getLeavesAmount(tree) {
            this.validateFunctionInput(
                'getLeavesAmount',
                {value: tree, type: 'array'}
            );
            let amount = 0;
            let length = tree.length;
            if (!length) {
                return amount;
            }
            while (length--) {
                if (tree[length].children) {
                    amount += this.getLeavesAmount(tree[length].children);
                }
                else {
                    amount += 1;
                }
            }
            return amount;
        },

        /**
        * 监听源树节点展开
        * 这里受事件监听回调函数传参的限制，只好分成四个函数，下同。
        *
        * @param {Object} data 当前节点
        * @param {Object} node 当前节点数据
        */
        onSourceTreeNodeExpand(data, node) {
            this.validateFunctionInput(
                'onSourceTreeNodeExpand',
                {value: data, type: 'object'},
                {value: node, type: 'object'}
            );
            this.keepExpandStatusConsistent('targetTree', node, true);
        },

        /**
        * 监听源树节点关闭
        *
        * @param {Object} data 当前节点
        * @param {Object} node 当前节点数据
        */
        onSourceTreeNodeCollapse(data, node) {
            this.validateFunctionInput(
                'onSourceTreeNodeCollapse',
                {value: data, type: 'object'},
                {value: node, type: 'object'}
            );
            this.keepExpandStatusConsistent('targetTree', node, false);
        },

        /**
        * 监听目标树节点展开
        *
        * @param {Object} data 当前节点
        * @param {Object} node 当前节点数据
        */
        onTargetTreeNodeExpand(data, node) {
            this.validateFunctionInput(
                'onTargetTreeNodeExpand',
                {value: data, type: 'object'},
                {value: node, type: 'object'}
            );
            this.keepExpandStatusConsistent('sourceTree', node, true);
        },

        /**
        * 监听目标树节点关闭
        *
        * @param {Object} data 当前节点
        * @param {Object} node 当前节点数据
        */
        onTargetTreeNodeCollapse(data, node) {
            this.validateFunctionInput(
                'onTargetTreeNodeCollapse',
                {value: data, type: 'object'},
                {value: node, type: 'object'}
            );
            this.keepExpandStatusConsistent('sourceTree', node, false);
        },

        /**
        * 同步源树与目标树相同节点的展开状态
        *
        * @param {string} target 待同步的树
        * @param {Object} node 当前节点
        * @param {boolean} expanded 是否展开
        */
        keepExpandStatusConsistent(target, node, expanded) {
            this.validateFunctionInput(
                'keepExpandStatusConsistent',
                {value: target, type: 'string'},
                {value: node, type: 'object'},
                {value: expanded, type: 'boolean'}
            );
            this.getNodeByKey(this.$refs[target].root, node.data.id).expanded = expanded;
        },

        /**
        * 保存目标树特定节点包括其子节点的展开状态
        *
        * @param {Object} root 根节点
        */
        saveTargetTreeExpandStauts(root) {
            this.validateFunctionInput(
                'saveTargetTreeExpandStauts',
                {value: root, type: 'object'}
            );
            this.traverseNode(root, node => {
                if (node.parent) {
                    this.targetTreeExpandStauts[node.data.id] = node.expanded;
                }
            });
        },

        /**
        * 恢复目标树特定节点包括其子节点的展开状态
        *
        * @param {Object} root 根节点
        */
        keepTargetTreeExpandStauts(root) {
            this.validateFunctionInput(
                'keepTargetTreeExpandStauts',
                {value: root, type: 'object'}
            );
            this.traverseNode(root, node => {
                if (node.parent) {
                    node.expanded = this.targetTreeExpandStauts[node.data.id];
                }
            });
        },

        /**
        * 将源树特定节点的展开状态复制到目标树
        *
        * @param {Object} node 对应节点
        */
        copyExpandedStatus(node) {
            this.validateFunctionInput(
                'copyExpandedStatus',
                {value: node, type: 'object'}
            );
            let sourceRoot = {};
            let targetRoot = {};
            let sourceExpandedStatus = {};
            while (node.parent && node.parent.parent) {
                node = node.parent;
            }
            // 遍历sourceTree上的目标节点
            sourceRoot = node;
            this.traverseNode(sourceRoot, node => {
                sourceExpandedStatus[node.key] = node.expanded;
            });
            // 遍历targetTree上的目标节点
            targetRoot = this.getNodeByKey(this.$refs.targetTree.root, sourceRoot.key);
            this.traverseNode(targetRoot, node => {
                node.expanded = sourceExpandedStatus[node.key];
            });
        },

        /**
        * 校验函数输入
        *
        * @param {string} name 校验函数名
        * @param {...Object} inputList 函数输入
        */
        validateFunctionInput(name, ...inputList) {
            for (let [index, input] of inputList.entries()) {
                if (
                    input.type
                    && (typeof input.value !== input.type && input.type !== 'array')
                    || (!Array.isArray(input.value) && input.type === 'array')
                ) {
                    throw 'function '
                          + name
                          + ' argument '
                          + index
                          + ' error. expect '
                          + input.type
                          + ' to '
                          + typeof input.value;
                }
            }
        }
    }
};
