<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import DataTable from '@/components/DataTable.vue'
import type { TableRow } from '@/components/DataTable.vue'
import {
  getRecords,
  getSessionState,
  postSessionState,
  postAddRecord,
  flushAddQueueNow,
} from '@/api/client'
import type { SessionState } from '@/api/types'

const leftData = ref<TableRow[]>([])
const rightData = ref<TableRow[]>([])
const sessionState = ref<SessionState>({
  selectedIds: [],
  sorting: [],
  selectedRows: [],
})
const leftPage = ref(1)
const leftTotalPages = ref(1)
const leftLoading = ref(false)
const leftIdFilter = ref('')
const newId = ref('')
const newMessage = ref('')
const newDate = ref('')

function onLeftIdFilterChange(value: string) {
  leftIdFilter.value = value
  leftPage.value = 1
  loadInitialLeftData()
}

function loadSession() {
  return getSessionState().then((state) => {
    sessionState.value = {
      selectedIds: state.selectedIds ?? [],
      sorting: state.sorting ?? [],
      selectedRows: state.selectedRows ?? [],
    }
    rightData.value = sessionState.value.selectedRows ?? []
  })
}

function loadLeftPage(page: number, append: boolean) {
  if (leftLoading.value) return
  leftLoading.value = true
  getRecords({
    page,
    limit: 20,
    idFilter: leftIdFilter.value.trim() || undefined,
    excludeIds: sessionState.value.selectedIds.length ? sessionState.value.selectedIds : undefined,
  })
    .then((res) => {
      if (append) {
        leftData.value = [...leftData.value, ...res.data]
      } else {
        leftData.value = res.data
      }
      leftPage.value = res.page
      leftTotalPages.value = res.totalPages
    })
    .finally(() => {
      leftLoading.value = false
    })
}

function loadInitialLeftData() {
  if (leftLoading.value) return
  leftLoading.value = true
  const params = {
    limit: 20,
    idFilter: leftIdFilter.value.trim() || undefined,
    excludeIds: sessionState.value.selectedIds.length ? sessionState.value.selectedIds : undefined,
  }
  Promise.all([getRecords({ ...params, page: 1 }), getRecords({ ...params, page: 2 })])
    .then(([r1, r2]) => {
      leftData.value = [...r1.data, ...r2.data]
      leftPage.value = 2
      leftTotalPages.value = r1.totalPages
    })
    .finally(() => {
      leftLoading.value = false
    })
}

function onLeftLoadMore() {
  if (leftLoading.value || leftPage.value >= leftTotalPages.value) return
  loadLeftPage(leftPage.value + 1, true)
}

function applySessionUpdate(update: Partial<SessionState>) {
  sessionState.value = { ...sessionState.value, ...update }
  if (update.selectedRows) rightData.value = update.selectedRows
  postSessionState({
    selectedIds: sessionState.value.selectedIds,
    sorting: sessionState.value.sorting,
    selectedRows: sessionState.value.selectedRows,
  })
}

function onLeftSelect(_e: Event, row: { original: TableRow }) {
  const item = row.original
  const selectedIds = [...sessionState.value.selectedIds, item.id]
  const selectedRows = [...(sessionState.value.selectedRows ?? []), item]
  applySessionUpdate({ selectedIds, selectedRows })
  leftData.value = leftData.value.filter((r) => r.id !== item.id)
}

function onRightSelect(_e: Event, row: { original: TableRow }) {
  const item = row.original
  const selectedIds = sessionState.value.selectedIds.filter((id) => id !== item.id)
  const selectedRows = (sessionState.value.selectedRows ?? []).filter((r) => r.id !== item.id)
  applySessionUpdate({ selectedIds, selectedRows })
}

function onRightUpdateData(value: TableRow[]) {
  applySessionUpdate({
    selectedIds: value.map((r) => r.id),
    selectedRows: value,
  })
}

function addLeftRecord() {
  const id = newId.value.trim()
  const message = newMessage.value.trim()
  let date = newDate.value.trim()
  if (!message) return
  if (!date) {
    date = new Date().toISOString().slice(0, 19)
  } else if (date.length === 16) {
    date = `${date}:00`
  }
  postAddRecord({
    ...(id ? { id } : {}),
    message,
    date,
  })
  newId.value = ''
  newMessage.value = ''
  newDate.value = ''
  flushAddQueueNow().then(() => {
    leftPage.value = 1
    loadLeftPage(1, false)
  })
}

watch(
  () => sessionState.value.selectedIds,
  () => {
    leftPage.value = 1
    loadInitialLeftData()
  },
  { deep: true }
)

onMounted(() => {
  loadSession().then(() => {
    loadInitialLeftData()
  })
})
</script>

<template>
  <UApp>
    <div class="flex h-screen w-full gap-4 p-4">
      <div class="flex flex-1 flex-col gap-4 rounded-lg border border-default bg-default p-4">
        <div class="rounded-lg border border-accented bg-elevated/50 p-3">
          <p class="mb-3 text-sm font-medium text-muted">Новая запись</p>
          <div class="flex flex-wrap items-end gap-2">
            <UFormField label="ID" class="min-w-0 flex-1 basis-20">
              <UInput v-model="newId" placeholder="ID (необязательно)" size="sm" />
            </UFormField>
            <UFormField label="Сообщение" class="min-w-0 flex-1 basis-40">
              <UInput v-model="newMessage" placeholder="Сообщение" size="sm" />
            </UFormField>
            <UFormField label="Дата" class="min-w-0 flex-1 basis-44">
              <UInput
                v-model="newDate"
                type="datetime-local"
                placeholder="Дата"
                size="sm"
              />
            </UFormField>
            <UButton
              label="Добавить"
              size="sm"
              icon="i-lucide-plus"
              :disabled="!newMessage.trim()"
              @click="addLeftRecord"
            />
          </div>
        </div>
        <DataTable
          :data="leftData"
          title="Исходная таблица"
          :infinite-scroll="true"
          @select="onLeftSelect"
          @load-more="onLeftLoadMore"
          @update:id-filter="onLeftIdFilterChange"
        />
      </div>
      <div class="flex flex-1 flex-col rounded-lg border border-default bg-default p-4">
        <DataTable
          :data="rightData"
          title="Перенесённые строки"
          draggable
          @select="onRightSelect"
          @update:data="onRightUpdateData"
        />
      </div>
    </div>
  </UApp>
</template>

<style scoped></style>
