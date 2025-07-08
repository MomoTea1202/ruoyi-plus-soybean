<script setup lang="tsx">
import { onMounted } from 'vue'
import { fetchGetUserPermList } from '@/service/api/system'
import { useTable, useTableOperate } from '@/hooks/common/table'
import { $t } from '@/locales'
import UserPermSearch from './modules/user-perm-search.vue';
import { useAuth } from '@/hooks/business/auth';
import { useAppStore } from '@/store/modules/app';

defineOptions({ name: 'UserPermList' })

const { hasAuth } = useAuth();
const appStore = useAppStore();

const {
  columns,
  data,
  loading,
  mobilePagination,
  getData,
  getDataByPage,
  searchParams,
  resetSearchParams
} = useTable({
  apiFn: fetchGetUserPermList,
  apiParams: {
    pageNum:  1,
    pageSize: 10,
    userName: null,
    userPerm: null
  },
  columns: () => [
    { type: 'selection', align: 'center', width: 48 },
    { key: 'index', title: $t('common.index'), align: 'center', width: 64 },
    { key: 'userName', title: 'User Name', align: 'center', minWidth: 120 },
    { key: 'userPerm', title: 'User Permission', align: 'center', minWidth: 120 }
  ]
});
const { checkedRowKeys} =
  useTableOperate(data, getData);
function handleResetSearch() {
  resetSearchParams();
}
</script>

<template>
  <div class="h-full flex-col-stretch gap-12px overflow-hidden lt-sm:overflow-auto">
  <UserPermSearch v-model:model="searchParams" @reset="handleResetSearch" @search="getDataByPage" />
  <NDataTable
          v-model:checked-row-keys="checkedRowKeys"
          :columns="columns"
          :data="data"
          size="small"
          :flex-height="!appStore.isMobile"
          :scroll-x="962"
          :loading="loading"
          remote
          :row-key="row => row.userId"
          :pagination="mobilePagination"
          class="h-full"
        />
</div>
  
  
</template>


<style scoped>
/* any custom styles here */
</style>
