<template>
    <div class="dual-tree-selector">
        <div class="tree-container source-tree-container">
            <el-tree
            ref="sourceTree"
            :data="dataUnChosen"
            :props="defaultProps"
            show-checkbox
            node-key="id"
            :expand-on-click-node="false"
            :render-content="renderContentUnChosen"
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
            :data="dataChosen"
            :props="defaultProps"
            show-checkbox
            node-key="id"
            :expand-on-click-node="false"
            :render-content="renderContentChosen"
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
            dataUnChosen: [{
                id: '0',
                label: '一级 1',
                children: [{
                    id: '0-0',
                    label: '二级 1-1',
                    children: [{
                        id: '0-0-0',
                        label: '三级 1-1-1'
                    }, {
                        id: '0-0-1',
                        label: '三级 1-1-2'
                    }]
                }]
            }, {
                id: '1',
                label: '一级 2',
                children: [{
                    id: '1-0',
                    label: '二级 2-1'
                }, {
                    id: '1-1',
                    label: '二级 2-2'
                }]
            }, {
                id: '2',
                label: '一级 3',
                children: [{
                    id: '2-0',
                    label: '二级 3-1'
                }, {
                    id: '2-1',
                    label: '二级 3-2'
                }]
            }],
            dataChosen: [],
            defaultProps: {
                children: 'children',
                label: 'label'
            }
        };
    },
    computed: {
        chosenAmount() {
            return this.getLeavesAmount(this.dataChosen);
        },
        totalAmount() {
            return this.getLeavesAmount(this.dataUnChosen);
        }
    },
    methods: {
        // check,UI层面,choose,数据层面,element的tree只有单向绑定(data->UI)
        check({node, data, store}, handleFunc) {
            store.setChecked(data, true);
            let parent = node.parent;
            while (parent) {
                store.setChecked(parent.data, true);
                parent = parent.parent;
            }
            handleFunc(store);
        },
        getCheckedDataArr(store) {
            let checkedData = JSON.parse(JSON.stringify(store.getCheckedNodes()));
            for (let i = checkedData.length - 1; i > 0; i--) {
                checkedData[i - 1].children = [checkedData[i]];
            }
            // 返回一个数组,方便递归
            return [checkedData[0]];
        },
        choose(store) {
            let checkedDataArr = this.getCheckedDataArr(store);
            this.mergeData(this.dataChosen, checkedDataArr);
            store.setChecked(checkedDataArr[0].id, false, true);
        },
        unChoose(store) {
            this.delData(this.dataChosen, this.getCheckedDataArr(store)[0]);
        },
        renderContentUnChosen(h, {node, data, store}) {
            return (
            <span>
                <span>
                <span>{node.label}</span>
                </span>
                <span style="float: right; margin-right: 20px">
                <Button size="mini" on-click={() => {
                    this.check({node, data, store}, this.choose);
                }}>+</Button>
                </span>
            </span>);
        },
        renderContentChosen(h, {node, data, store}) {
            return (
            <span>
                <span>
                <span>{node.label}</span>
                </span>
                <span style="float: right; margin-right: 20px">
                <Button
                size="mini"
                on-click={() => {
                    store.setChecked(data, true);
                    this.unChoose(store);
                    store.remove(data);
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
            this.dataChosen = JSON.parse(JSON.stringify(this.dataUnChosen));
        },
        delTotal() {
            this.dataChosen = [];
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
        onSourceTreeNodeExpand(data) {
            this.keepExpandStatusConsistent('targetTree', data, true);
        },
        onSourceTreeNodeCollapse(data) {
            this.keepExpandStatusConsistent('targetTree', data, false);
        },
        onTargetTreeNodeExpand(data) {
            this.keepExpandStatusConsistent('sourceTree', data, true);
        },
        onTargetTreeNodeCollapse(data) {
            this.keepExpandStatusConsistent('sourceTree', data, false);
        },
        keepExpandStatusConsistent(target, data, expanded) {
            this.expandNodeByKey(this.$refs[target].$children, data.id, expanded);
        },
        expandNodeByKey(vmArr, key, expanded) {
            if (!Array.isArray(vmArr)) {
                return false;
            }
            let i = vmArr.length;
            while (i--) {
                if (vmArr[i].node && vmArr[i].node.data.id === key) {
                    vmArr[i].expanded = expanded;
                    break;
                }
                else {
                    this.expandNodeByKey(vmArr[i].$children, key, expanded);
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