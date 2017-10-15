/**
 * @file 路由配置
 * @author thu
 */
import Vue from 'vue';
import Router from 'vue-router';
import DualTreeSelector from '@/components/dual-tree-selector';

Vue.use(Router);

export default new Router({
    routes: [
        {
            path: '/',
            name: 'Hello',
            component: DualTreeSelector
        }
    ]
});
