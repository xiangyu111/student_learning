import React from 'react';
import { Table as AntdTable } from 'antd';

// 高阶组件，确保 Table 的 dataSource 是数组
const Table = (props) => {
  const { dataSource, ...rest } = props;
  
  // 确保 dataSource 是数组
  const safeDataSource = Array.isArray(dataSource) ? dataSource : [];
  
  return <AntdTable dataSource={safeDataSource} {...rest} />;
};

// 将 AntdTable 的静态属性复制到新的 Table 组件
Table.Column = AntdTable.Column;
Table.ColumnGroup = AntdTable.ColumnGroup;
Table.Summary = AntdTable.Summary;

export default Table; 