import React, { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import AppState from 'App/State/AppState';
import IndexerStatsAppState from 'App/State/IndexerStatsAppState';
import Alert from 'Components/Alert';
import BarChart from 'Components/Chart/BarChart';
import DoughnutChart from 'Components/Chart/DoughnutChart';
import StackedBarChart from 'Components/Chart/StackedBarChart';
import LoadingIndicator from 'Components/Loading/LoadingIndicator';
import PageContent from 'Components/Page/PageContent';
import PageContentBody from 'Components/Page/PageContentBody';
import PageToolbar from 'Components/Page/Toolbar/PageToolbar';
import PageToolbarSection from 'Components/Page/Toolbar/PageToolbarSection';
import { align, kinds } from 'Helpers/Props';
import {
  fetchIndexerStats,
  setIndexerStatsFilter,
} from 'Store/Actions/indexerStatsActions';
import {
  IndexerStatsHost,
  IndexerStatsIndexer,
  IndexerStatsUserAgent,
} from 'typings/IndexerStats';
import getErrorMessage from 'Utilities/Object/getErrorMessage';
import translate from 'Utilities/String/translate';
import IndexerStatsFilterMenu from './IndexerStatsFilterMenu';
import styles from './IndexerStats.css';

function getAverageResponseTimeData(indexerStats: IndexerStatsIndexer[]) {
  const data = indexerStats.map((indexer) => {
    return {
      label: indexer.indexerName,
      value: indexer.averageResponseTime,
    };
  });

  data.sort((a, b) => {
    return b.value - a.value;
  });

  return data;
}

function getFailureRateData(indexerStats: IndexerStatsIndexer[]) {
  const data = indexerStats.map((indexer) => {
    return {
      label: indexer.indexerName,
      value:
        (indexer.numberOfFailedQueries +
          indexer.numberOfFailedRssQueries +
          indexer.numberOfFailedAuthQueries +
          indexer.numberOfFailedGrabs) /
        (indexer.numberOfQueries +
          indexer.numberOfRssQueries +
          indexer.numberOfAuthQueries +
          indexer.numberOfGrabs),
    };
  });

  data.sort((a, b) => {
    return b.value - a.value;
  });

  return data;
}

function getTotalRequestsData(indexerStats: IndexerStatsIndexer[]) {
  const data = {
    labels: indexerStats.map((indexer) => indexer.indexerName),
    datasets: [
      {
        label: translate('SearchQueries'),
        data: indexerStats.map((indexer) => indexer.numberOfQueries),
      },
      {
        label: translate('RssQueries'),
        data: indexerStats.map((indexer) => indexer.numberOfRssQueries),
      },
      {
        label: translate('AuthQueries'),
        data: indexerStats.map((indexer) => indexer.numberOfAuthQueries),
      },
    ],
  };

  return data;
}

function getNumberGrabsData(indexerStats: IndexerStatsIndexer[]) {
  const data = indexerStats.map((indexer) => {
    return {
      label: indexer.indexerName,
      value: indexer.numberOfGrabs - indexer.numberOfFailedGrabs,
    };
  });

  data.sort((a, b) => {
    return b.value - a.value;
  });

  return data;
}

function getUserAgentGrabsData(indexerStats: IndexerStatsUserAgent[]) {
  const data = indexerStats.map((indexer) => {
    return {
      label: indexer.userAgent ? indexer.userAgent : 'Other',
      value: indexer.numberOfGrabs,
    };
  });

  data.sort((a, b) => {
    return b.value - a.value;
  });

  return data;
}

function getUserAgentQueryData(indexerStats: IndexerStatsUserAgent[]) {
  const data = indexerStats.map((indexer) => {
    return {
      label: indexer.userAgent ? indexer.userAgent : 'Other',
      value: indexer.numberOfQueries,
    };
  });

  data.sort((a, b) => {
    return b.value - a.value;
  });

  return data;
}

function getHostGrabsData(indexerStats: IndexerStatsHost[]) {
  const data = indexerStats.map((indexer) => {
    return {
      label: indexer.host ? indexer.host : 'Other',
      value: indexer.numberOfGrabs,
    };
  });

  data.sort((a, b) => {
    return b.value - a.value;
  });

  return data;
}

function getHostQueryData(indexerStats: IndexerStatsHost[]) {
  const data = indexerStats.map((indexer) => {
    return {
      label: indexer.host ? indexer.host : 'Other',
      value: indexer.numberOfQueries,
    };
  });

  data.sort((a, b) => {
    return b.value - a.value;
  });

  return data;
}

const indexerStatsSelector = () => {
  return createSelector(
    (state: AppState) => state.indexerStats,
    (indexerStats: IndexerStatsAppState) => {
      return indexerStats;
    }
  );
};

function IndexerStats() {
  const { isFetching, isPopulated, item, error, filters, selectedFilterKey } =
    useSelector(indexerStatsSelector());
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchIndexerStats());
  }, [dispatch]);

  const onFilterSelect = useCallback(
    (value: string) => {
      dispatch(setIndexerStatsFilter({ selectedFilterKey: value }));
    },
    [dispatch]
  );

  const isLoaded = !error && isPopulated;

  return (
    <PageContent>
      <PageToolbar>
        <PageToolbarSection alignContent={align.RIGHT} collapseButtons={false}>
          <IndexerStatsFilterMenu
            selectedFilterKey={selectedFilterKey}
            filters={filters}
            onFilterSelect={onFilterSelect}
            isDisabled={false}
          />
        </PageToolbarSection>
      </PageToolbar>
      <PageContentBody>
        {isFetching && !isPopulated && <LoadingIndicator />}

        {!isFetching && !!error && (
          <Alert kind={kinds.DANGER}>
            {getErrorMessage(error, 'Failed to load indexer stats from API')}
          </Alert>
        )}

        {isLoaded && (
          <div>
            <div className={styles.fullWidthChart}>
              <BarChart
                data={getAverageResponseTimeData(item.indexers)}
                title={translate('AverageResponseTimesMs')}
              />
            </div>
            <div className={styles.fullWidthChart}>
              <BarChart
                data={getFailureRateData(item.indexers)}
                title={translate('IndexerFailureRate')}
                kind={kinds.WARNING}
              />
            </div>
            <div className={styles.halfWidthChart}>
              <StackedBarChart
                data={getTotalRequestsData(item.indexers)}
                title={translate('TotalIndexerQueries')}
              />
            </div>
            <div className={styles.halfWidthChart}>
              <BarChart
                data={getNumberGrabsData(item.indexers)}
                title={translate('TotalIndexerSuccessfulGrabs')}
              />
            </div>
            <div className={styles.halfWidthChart}>
              <BarChart
                data={getUserAgentQueryData(item.userAgents)}
                title={translate('TotalUserAgentQueries')}
                horizontal={true}
              />
            </div>
            <div className={styles.halfWidthChart}>
              <BarChart
                data={getUserAgentGrabsData(item.userAgents)}
                title={translate('TotalUserAgentGrabs')}
                horizontal={true}
              />
            </div>
            <div className={styles.halfWidthChart}>
              <DoughnutChart
                data={getHostQueryData(item.hosts)}
                title={translate('TotalHostQueries')}
                horizontal={true}
              />
            </div>
            <div className={styles.halfWidthChart}>
              <DoughnutChart
                data={getHostGrabsData(item.hosts)}
                title={translate('TotalHostGrabs')}
                horizontal={true}
              />
            </div>
          </div>
        )}
      </PageContentBody>
    </PageContent>
  );
}

export default IndexerStats;
