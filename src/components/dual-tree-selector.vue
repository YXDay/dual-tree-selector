<template>
    <div class="dual-tree-selector">
        <div class="tree-container source-tree-container">
            <el-tree
            ref="sourceTree"
            :data="sourceTreeData"
            :props="defaultProps"
            show-checkbox
            :node-key="key"
            :expand-on-click-node="false"
            :render-content="renderSourceTreeContent"
            @node-expand="onSourceTreeNodeExpand"
            @node-collapse="onSourceTreeNodeCollapse">
            </el-tree>
            <div class="edit-total">
                <span @click="addTotal">全部添加</span>
            </div>
        </div>
        <div class="tree-container target-tree-container">
            <el-tree
            ref="targetTree"
            :data="targetTreeData"
            :props="defaultProps"
            show-checkbox
            node-key="id"
            :expand-on-click-node="false"
            :render-content="renderTargetTreeContent"
            @node-expand="onTargetTreeNodeExpand"
            @node-collapse="onTargetTreeNodeCollapse">
            </el-tree>
            <div class="edit-total">
                <span>已选分类数: {{chosenAmount}}/{{totalAmount}}</span>
                <span @click="delTotal">全部删除</span>
            </div>
        </div>
    </div>
</template>
<script>
import {Button} from 'element-ui';
export default {
    data() {
        return {
            sourceTreeData: [{
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
            }, {
                id: '1',
                label: '一级 2',
                added: false,
                children: [{
                    id: '1-0',
                    label: '二级 2-1',
                    added: false
                }, {
                    id: '1-1',
                    label: '二级 2-2',
                    added: false
                }]
            }, {
                id: '2',
                label: '一级 3',
                added: false,
                children: [{
                    id: '2-0',
                    label: '二级 3-1',
                    added: false
                }, {
                    id: '2-1',
                    label: '二级 3-2',
                    added: false
                }]
            }],
            targetTreeData: [],
            key: 'id',
            defaultProps: {
                children: 'children',
                label: 'label'
            },

            // 目标树节点展开状态
            targetTreeExpandStauts: {}
        };
    },
    computed: {
        chosenAmount() {
            return this.getLeavesAmount(this.targetTreeData);
        },
        totalAmount() {
            return this.getLeavesAmount(this.sourceTreeData);
        }
    },
    methods: {
        addNode({node, data, store}) {
            store.setChecked(data, true);
            let parent = node.parent;
            while (parent) {
                store.setChecked(parent.data, true);
                parent = parent.parent;
            }
            let checkedDataArr = this.getCheckedDataArr(store);
            this.mergeData(this.targetTreeData, checkedDataArr);
            store.setChecked(checkedDataArr[0].id, false, true);
            this.setAddStatus([data], true);
            this.targetTreeData.sort((prev, next) => prev[this.key] - next[this.key]);
        },
        delNode({node, data, store}) {
            this.saveTargetTreeExpandStauts(this.$refs.targetTree.$children);
            store.setChecked(data, true);
            this.delData(this.targetTreeData, this.getCheckedDataArr(store)[0]);
            this.setAddStatus([this.getNodeByKey(this.$refs.sourceTree.root, data[this.key]).data], false);
        },

        /**
        * 根据key值获取node
        * 广度优先遍历, 可以传入任意节点.
        *
        * @param {Array} root  目标根节点
        * @param {Array} key 目标key值
        * @return {Object} node 目标node
        */
        getNodeByKey(root, key) {
            let stack = [root];
            while (stack.length !== 0) {
                let node = stack.pop();
                if (node.key === key) {
                    return node;
                }
                if (node.childNodes) {
                    stack.push.apply(stack, node.childNodes);
                }
            }
            return {};
        },
        getCheckedDataArr(store) {
            let checkedData = JSON.parse(JSON.stringify(store.getCheckedNodes()));
            for (let i = checkedData.length - 1; i > 0; i--) {
                checkedData[i - 1].children = [checkedData[i]];
            }
            // 返回一个数组,方便递归
            return [checkedData[0]];
        },
        setAddStatus(dataArr, added) {
            if (!Array.isArray(dataArr)) {
                return;
            }
            dataArr.forEach(data => {
                data.added = added;
                this.setAddStatus(data.children, added);
            });
        },
        renderSourceTreeContent(h, {node, data, store}) {
            return (
            <span>
                <span>
                    <span>{node.label}</span>
                </span>
                <span style="float: right; margin-right: 20px">
                    <Button size="mini" on-click={() => {
                        this.saveTargetTreeExpandStauts(this.$refs.targetTree.$children);
                        this.addNode({node, data, store});
                        this.$nextTick(() => {
                            this.keepTargetTreeExpandStauts(this.$refs.targetTree.$children);
                            this.copyExpandedStatus(node);
                        });
                    }}>
                        {data.added ? '✓' : '+'}
                    </Button>
                </span>
            </span>);
        },
        renderTargetTreeContent(h, {node, data, store}) {
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
        * 左树数据递归合入右树
        *
        * @param {Array} targetArr 右树data数组
        * @param {Array} objArr 左树被选中的data数组
        */
        mergeData(targetArr, objArr) {
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
        * 右树递归删除
        *
        * @param {Array} targetArr 右树data数组
        * @param {Array} delObj 需要被删除的数据
        */
        delData(targetArr, delObj) {
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
        addTotal() {
            this.targetTreeData = JSON.parse(JSON.stringify(this.sourceTreeData));
        },
        delTotal() {
            this.targetTreeData = [];
        },

        /**
        * 递归获取叶子节点数目
        *
        * @param {Array} tree 树
        * @return {number} amount 叶子节点数目
        */
        getLeavesAmount(tree) {
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
        onSourceTreeNodeExpand(data, node) {
            this.keepExpandStatusConsistent('targetTree', node, true);
        },
        onSourceTreeNodeCollapse(data, node) {
            this.keepExpandStatusConsistent('targetTree', node, false);
        },
        onTargetTreeNodeExpand(data, node) {
            this.keepExpandStatusConsistent('sourceTree', node, true);
        },
        onTargetTreeNodeCollapse(data, node) {
            this.keepExpandStatusConsistent('sourceTree', node, false);
        },
        keepExpandStatusConsistent(target, node, expanded) {
            this.getNodeByKey(this.$refs[target].root, node.data[this.key]).expanded = expanded;
        },
        saveTargetTreeExpandStauts(vmArr) {
            if (!Array.isArray(vmArr)) {
                return false;
            }
            vmArr.forEach(vm => {
                if (vm.expanded) {
                    this.targetTreeExpandStauts[vm.node.data[this.key]] = vm.expanded;
                    this.saveTargetTreeExpandStauts(vm.$children);
                }
            });
        },
        keepTargetTreeExpandStauts(vmArr) {
            if (!Array.isArray(vmArr)) {
                return false;
            }
            vmArr.forEach(vm => {
                if (vm.node) {
                    vm.expanded = this.targetTreeExpandStauts[vm.node.data[this.key]];
                    this.keepTargetTreeExpandStauts(vm.$children);
                }
            });
        },
        copyExpandedStatus(node) {
            let sourceRoot = {};
            let targetRoot = {};
            let sourceExpandedStatus = {};
            let sourceStack = [];
            let targetStack = [];
            while (node.parent.parent) {
                node = node.parent;
            }
            sourceRoot = node;
            sourceStack.push(sourceRoot);
            // 广度优先遍历sourceTree上的目标节点
            while (sourceStack.length !== 0) {
                let node = sourceStack.pop();
                sourceExpandedStatus[node.key] = node.expanded;
                if (node.childNodes) {
                    sourceStack.push.apply(sourceStack, node.childNodes);
                }
            }
            targetRoot = this.getNodeByKey(this.$refs.targetTree.root, sourceRoot.key);
            targetStack.push(targetRoot);
            // 广度优先遍历targetTree上的目标节点
            while (targetStack.length !== 0) {
                let node = targetStack.pop();
                node.expanded = sourceExpandedStatus[node.key];
                if (node.childNodes) {
                    targetStack.push.apply(targetStack, node.childNodes);
                }
            }
        }
    }
};
</script>
<style lang="less">
    .dual-tree-selector {
        .el-tree__empty-block {
            display: none;
        }
        .tree-container {
            .el-tree {
                height: 200px;
                overflow: auto;
            }
            .edit-total {
                span {
                    cursor: pointer;
                }
            }
        }
        .source-tree-container {
            float: left;
            width: 50%;
            height: 100%;
        }
        .target-tree-container {
            height: 100%;
        }
    }
</style>