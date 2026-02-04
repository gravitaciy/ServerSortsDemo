<script setup lang="ts">
import { computed, h, nextTick, onMounted, ref, resolveComponent, watch } from 'vue'
import { useSortable } from '@vueuse/integrations/useSortable'
import type { TableColumn } from '@nuxt/ui'

export type TableRow = {
  id: string
  message: string
  date: string
}

const props = defineProps<{
  data: TableRow[]
  title?: string
  draggable?: boolean
}>()

const emit = defineEmits<{
  select: [event: Event, row: { original: TableRow }]
  'update:data': [value: TableRow[]]
}>()

const displayOrder = ref<string[]>([])
const currentViewRef = ref<TableRow[]>([])
let skipSyncFromDrag = false

function sortByColumn(list: TableRow[], sorting: { id: string; desc: boolean }[]): TableRow[] {
  if (!sorting.length) return [...list]
  return [...list].sort((a, b) => {
    for (const { id: colId, desc } of sorting) {
      const key = colId as keyof TableRow
      const aVal = a[key]
      const bVal = b[key]
      let cmp = 0
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        cmp = aVal.localeCompare(bVal)
      } else if (aVal !== bVal) {
        cmp = aVal < bVal ? -1 : 1
      }
      if (cmp !== 0) return desc ? -cmp : cmp
    }
    return 0
  })
}

if (props.draggable) {
  watch(
    () => props.data,
    (val) => {
      if (val === currentViewRef.value) return
      const ids = new Set(val.map((r) => r.id))
      const prevIds = new Set(displayOrder.value)
      if (displayOrder.value.length === 0) {
        displayOrder.value = val.map((r) => r.id)
      } else {
        const nextOrder = displayOrder.value.filter((id) => ids.has(id))
        for (const r of val) {
          if (!prevIds.has(r.id)) nextOrder.push(r.id)
        }
        displayOrder.value = nextOrder
      }
    },
    { immediate: true, deep: true }
  )

  const displayedData = computed(() => {
    const data = props.data
    const order = displayOrder.value
    const byId = new Map(data.map((r) => [r.id, r]))
    const result: TableRow[] = []
    for (const id of order) {
      const row = byId.get(id)
      if (row) result.push(row)
    }
    for (const r of data) {
      if (!order.includes(r.id)) result.push(r)
    }
    return result
  })

  watch(
    displayedData,
    (val) => {
      if (skipSyncFromDrag) {
        skipSyncFromDrag = false
        return
      }
      currentViewRef.value = [...val]
    },
    { immediate: true, deep: true }
  )

  watch(
    currentViewRef,
    (val) => {
      const ids = val.map((r) => r.id)
      if (ids.length === 0) return
      const same =
        displayOrder.value.length === ids.length &&
        ids.every((id, i) => displayOrder.value[i] === id)
      if (same) return
      displayOrder.value = ids
      emit('update:data', val)
      skipSyncFromDrag = true
    },
    { deep: true }
  )
}

const sorting = ref<{ id: string; desc: boolean }[]>([])

if (props.draggable) {
  watch(
    sorting,
    (sortState) => {
      const sorted = sortByColumn([...props.data], sortState)
      displayOrder.value = sorted.map((r) => r.id)
    },
    { deep: true }
  )
}

onMounted(() => {
  if (props.draggable) {
    nextTick(() => {
      useSortable('.data-table-sortable-tbody', currentViewRef, {
        animation: 150,
      })
    })
  }
})

const tableRef = ref<{
  tableApi?: {
    getColumn: (id: string) => { setFilterValue: (v: string) => void; getFilterValue: () => string }
  }
} | null>(null)

const globalFilter = ref('')
const idFilter = ref('')
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
    <div class="data-table-scroll min-h-0 max-h-[960px] flex-1 overflow-y-auto">
      <UTable
        ref="tableRef"
        v-model:global-filter="globalFilter"
        v-model:sorting="sorting"
        v-model:column-filters="columnFilters"
        :data="draggable ? currentViewRef : data"
        :columns="sortableColumns"
        :sorting-options="draggable ? { manualSorting: true } : undefined"
        :ui="draggable ? { tbody: 'data-table-sortable-tbody' } : undefined"
        sticky
        class="cursor-pointer"
        @select="onSelect"
      />
    </div>
  </div>
</template>

<style scoped>
.data-table-scroll :deep(tbody tr) {
  height: 45px;
}

.data-table-scroll :deep(tbody tr td) {
  padding-top: 0.375rem;
  padding-bottom: 0.375rem;
}
</style>
