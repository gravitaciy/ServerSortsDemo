<script setup lang="ts">
import { h, ref, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'

type TableRow = {
  id: string
  message: string
  date: string
}

const leftData = ref<TableRow[]>([
  { id: '1', message: 'First message', date: '2024-01-15T10:00:00' },
  { id: '2', message: 'Second message', date: '2024-02-20T14:30:00' },
  { id: '3', message: 'Third message', date: '2024-03-10T09:15:00' },
  { id: '4', message: 'Fourth message', date: '2024-04-05T16:45:00' },
  { id: '5', message: 'Fifth message', date: '2024-05-12T11:20:00' },
  { id: '6', message: 'Sixth message', date: '2024-06-01T08:00:00' },
  { id: '7', message: 'Seventh message', date: '2024-07-18T13:00:00' },
  { id: '8', message: 'Eighth message', date: '2024-08-22T17:30:00' },
])

const rightData = ref<TableRow[]>([])

const leftTableRef = ref<{ tableApi?: { getColumn: (id: string) => { setFilterValue: (v: string) => void; getFilterValue: () => string } } } | null>(null)
const rightTableRef = ref<{ tableApi?: { getColumn: (id: string) => { setFilterValue: (v: string) => void; getFilterValue: () => string } } } | null>(null)

const leftGlobalFilter = ref('')
const rightGlobalFilter = ref('')
const leftIdFilter = ref('')
const rightIdFilter = ref('')
const leftSorting = ref<{ id: string; desc: boolean }[]>([])
const rightSorting = ref<{ id: string; desc: boolean }[]>([])
const leftColumnFilters = ref<{ id: string; value: unknown }[]>([])
const rightColumnFilters = ref<{ id: string; value: unknown }[]>([])

function getSortableHeader(column: { getIsSorted: () => false | 'asc' | 'desc'; toggleSorting: (desc?: boolean) => void; id: string }, label: string) {
  const UButton = resolveComponent('UButton')
  const isSorted = column.getIsSorted()
  return h(
    UButton,
    {
      color: 'neutral',
      variant: 'ghost',
      label,
      icon: isSorted === 'asc' ? 'i-lucide-arrow-up-narrow-wide' : isSorted === 'desc' ? 'i-lucide-arrow-down-wide-narrow' : 'i-lucide-arrow-up-down',
      class: '-mx-2.5',
      onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
    }
  )
}

const sortableColumns: TableColumn<TableRow>[] = [
  {
    accessorKey: 'id',
    header: ({ column }) => getSortableHeader(column, 'ID'),
    cell: ({ row }) => String(row.getValue('id')),
  },
  {
    accessorKey: 'message',
    header: ({ column }) => getSortableHeader(column, 'Message'),
    cell: ({ row }) => row.getValue('message') as string,
  },
  {
    accessorKey: 'date',
    header: ({ column }) => getSortableHeader(column, 'Date'),
    cell: ({ row }) =>
      new Date(row.getValue('date') as string).toLocaleString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
  },
]

function onLeftSelect(_e: Event, row: { original: TableRow }) {
  const item = row.original
  leftData.value = leftData.value.filter((r) => r.id !== item.id)
  rightData.value = [...rightData.value, { ...item }]
}

function onRightSelect(_e: Event, row: { original: TableRow }) {
  const item = row.original
  rightData.value = rightData.value.filter((r) => r.id !== item.id)
  leftData.value = [...leftData.value, { ...item }]
}

function syncLeftIdFilter(value: string) {
  leftIdFilter.value = value
  leftTableRef.value?.tableApi?.getColumn('id')?.setFilterValue(value)
}

function syncRightIdFilter(value: string) {
  rightIdFilter.value = value
  rightTableRef.value?.tableApi?.getColumn('id')?.setFilterValue(value)
}
</script>

<template>
  <UApp>
    <div class="flex h-screen w-full gap-4 p-4">
      <!-- Left container -->
      <div class="flex flex-1 flex-col gap-3 rounded-lg border border-default bg-default p-4">
        <h2 class="text-lg font-semibold">Исходная таблица</h2>
        <div class="flex flex-wrap items-center gap-3 border-b border-accented pb-3">
          <UInput
            v-model="leftGlobalFilter"
            class="max-w-xs"
            placeholder="Поиск..."
            icon="i-lucide-search"
          />
          <UInput
            :model-value="leftIdFilter"
            class="max-w-[120px]"
            placeholder="Фильтр по ID"
            @update:model-value="syncLeftIdFilter"
          />
        </div>
        <UTable
          ref="leftTableRef"
          v-model:global-filter="leftGlobalFilter"
          v-model:sorting="leftSorting"
          v-model:column-filters="leftColumnFilters"
          :data="leftData"
          :columns="sortableColumns"
          class="flex-1 cursor-pointer"
          @select="onLeftSelect"
        />
      </div>

      <!-- Right container -->
      <div class="flex flex-1 flex-col gap-3 rounded-lg border border-default bg-default p-4">
        <h2 class="text-lg font-semibold">Перенесённые строки</h2>
        <div class="flex flex-wrap items-center gap-3 border-b border-accented pb-3">
          <UInput
            v-model="rightGlobalFilter"
            class="max-w-xs"
            placeholder="Поиск..."
            icon="i-lucide-search"
          />
          <UInput
            :model-value="rightIdFilter"
            class="max-w-[120px]"
            placeholder="Фильтр по ID"
            @update:model-value="syncRightIdFilter"
          />
        </div>
        <UTable
          ref="rightTableRef"
          v-model:global-filter="rightGlobalFilter"
          v-model:sorting="rightSorting"
          v-model:column-filters="rightColumnFilters"
          :data="rightData"
          :columns="sortableColumns"
          class="flex-1 cursor-pointer"
          @select="onRightSelect"
        />
      </div>
    </div>
  </UApp>
</template>

<style scoped></style>
