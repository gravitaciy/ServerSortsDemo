<script setup lang="ts">
import { h, ref, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'

export type TableRow = {
  id: string
  message: string
  date: string
}

defineProps<{
  data: TableRow[]
  title?: string
}>()

const emit = defineEmits<{
  select: [event: Event, row: { original: TableRow }]
}>()

const tableRef = ref<{
  tableApi?: {
    getColumn: (id: string) => { setFilterValue: (v: string) => void; getFilterValue: () => string }
  }
} | null>(null)

const globalFilter = ref('')
const idFilter = ref('')
const sorting = ref<{ id: string; desc: boolean }[]>([])
const columnFilters = ref<{ id: string; value: unknown }[]>([])

function getSortableHeader(
  column: {
    getIsSorted: () => false | 'asc' | 'desc'
    toggleSorting: (desc?: boolean) => void
    id: string
  },
  label: string
) {
  const UButton = resolveComponent('UButton')
  const isSorted = column.getIsSorted()
  return h(UButton, {
    color: 'neutral',
    variant: 'ghost',
    label,
    icon:
      isSorted === 'asc'
        ? 'i-lucide-arrow-up-narrow-wide'
        : isSorted === 'desc'
          ? 'i-lucide-arrow-down-wide-narrow'
          : 'i-lucide-arrow-up-down',
    class: '-mx-2.5',
    onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
  })
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

function syncIdFilter(value: string) {
  idFilter.value = value
  tableRef.value?.tableApi?.getColumn('id')?.setFilterValue(value)
}

function onSelect(e: Event, row: { original: TableRow }) {
  emit('select', e, row)
}
</script>

<template>
  <div class="flex flex-1 flex-col gap-3">
    <h2 v-if="title" class="text-lg font-semibold">{{ title }}</h2>
    <div class="flex flex-wrap items-center gap-3 border-b border-accented pb-3">
      <UInput
        v-model="globalFilter"
        class="max-w-xs"
        placeholder="Поиск..."
        icon="i-lucide-search"
      />
      <UInput
        :model-value="idFilter"
        class="max-w-[120px]"
        placeholder="Фильтр по ID"
        @update:model-value="syncIdFilter"
      />
    </div>
    <UTable
      ref="tableRef"
      v-model:global-filter="globalFilter"
      v-model:sorting="sorting"
      v-model:column-filters="columnFilters"
      :data="data"
      :columns="sortableColumns"
      class="flex-1 cursor-pointer"
      @select="onSelect"
    />
  </div>
</template>
