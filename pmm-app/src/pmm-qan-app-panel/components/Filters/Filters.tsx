import React, { ReactElement, useContext, useEffect, useState } from 'react';
import { Button } from 'antd';
import { PanelProvider } from '../../panel/panel.provider';
import FiltersService from './Filters.service';
import { Form as FormFinal } from 'react-final-form';
import Search from 'antd/lib/input/Search';
import { CheckboxGroup } from './components/CheckboxGroup/CheckboxGroup';
import useWindowSize from 'react-plugins-deps/helpers/WindowSize.hooks';
import ScrollArea from 'react-scrollbar';
import { FILTERS_BODY_HEIGHT, FILTERS_GROUPS } from './Filters.constants';
import { Styling } from './Filters.styles';
import { GroupInterface } from './Filters.types';

export const Filters = ({ contextActions, groups, form, labels, filters }) => {
  // @ts-ignore
  const [width, height] = useWindowSize();
  const [filtersBodyHeight, setFiltersBodyHeight] = useState(FILTERS_BODY_HEIGHT);
  const [filter, setFilter] = useState('');
  const [showAll, showSetAll] = useState(true);
  const checkboxesSelected = groups
    .map(group => filters[group.dataKey])
    .filter(Boolean)
    .map(item => item.name)
    .flat()
    .some(item => item.checked);

  // TODO: replace with something more elegant & fast
  useEffect(() => {
    const FILTERS_HEADER_SIZE = 50;
    const FILTERS_MARGIN_BOTTOM = 20;
    const filtersWrapperElement = document.querySelector('#query-analytics-filters');
    const filtersHeight = filtersWrapperElement
      ? height - filtersWrapperElement.getBoundingClientRect().y - FILTERS_HEADER_SIZE - FILTERS_MARGIN_BOTTOM
      : FILTERS_BODY_HEIGHT;
    setFiltersBodyHeight(filtersHeight);
  }, [height]);

  return (
    <div>
      <div className={Styling.filtersHeader}>
        <h5 className={Styling.title}>Filters</h5>
        <Button
          type="link"
          className={Styling.showAllButton}
          onClick={showSetAll.bind(null, !showAll)}
          disabled={!checkboxesSelected}
        >
          {showAll ? 'Show Selected' : 'Show All'}
        </Button>
        <Button
          type="link"
          className={Styling.resetButton}
          id="reset-all-filters"
          onClick={() => {
            setFilter('');
            showSetAll(true);
            contextActions.resetLabels();
            form.reset();
          }}
          disabled={!checkboxesSelected}
        >
          Reset All
        </Button>
      </div>
      <ScrollArea className={Styling.filtersWrapper} style={{ height: filtersBodyHeight + 'px' }}>
        <Search
          placeholder="Filters search..."
          onChange={e => {
            setFilter(e.target.value);
            e.stopPropagation();
          }}
          value={filter}
          style={{ width: '100%' }}
        />
        {groups
          .filter(group => filters[group.dataKey])
          .map(group => {
            const { name, dataKey } = group;
            return (
              <CheckboxGroup
                key={name}
                {...{
                  name,
                  items: filters[dataKey].name,
                  group: dataKey,
                  showAll,
                  filter,
                  labels,
                }}
              />
            );
          })}
      </ScrollArea>
    </div>
  );
};

const FiltersContainer = () => {
  const [filters, setFilters] = useState({});
  const [groups, setGroups] = useState<GroupInterface[]>([]);
  const {
    contextActions,
    panelState: { labels = {}, from, to, columns },
  } = useContext(PanelProvider);

  useEffect(() => {
    (async () => {
      try {
        const result = await FiltersService.getQueryOverviewFiltersList(labels, from, to, columns[0]);
        setFilters(result);
        setGroups(FILTERS_GROUPS);
      } catch (e) {
        //TODO: add error handling
      }
    })();
  }, [labels, from, to, columns]);

  return (
    <FormFinal
      onSubmit={() => {}}
      initialValues={Object.entries(labels).reduce((acc, data) => {
        const [key, values] = data;
        Array.isArray(values) &&
          values.forEach(value => {
            acc[`${key}:${value.replace(/\./gi, '--') || 'na'}`] = true;
          });
        return acc;
      }, {})}
      render={({ form, handleSubmit }): ReactElement => {
        // @ts-ignore
        return (
          <form
            onSubmit={handleSubmit}
            className="add-instance-form app-theme-dark"
            onChange={e => contextActions.setLabels(form.getState().values)}
          >
            <Filters
              contextActions={contextActions}
              form={form}
              groups={groups}
              labels={labels}
              filters={filters}
            />
          </form>
        );
      }}
    />
  );
};

export default FiltersContainer;
