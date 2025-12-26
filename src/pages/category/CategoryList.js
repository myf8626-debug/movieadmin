import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, message, Space, Popconfirm, Select, InputNumber } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, AppstoreOutlined } from '@ant-design/icons';
// 关键：导入所有 Ant Design 图标
import * as Icons from '@ant-design/icons';
import { getCategoryList, createCategory, updateCategory, deleteCategory } from '../../utils/api';
import { renderIcon, commonIcons, getIconComponent } from '../../utils/iconUtils';
import dayjs from 'dayjs';
import '../../styles/list-pages.css';

const CategoryList = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [form] = Form.useForm();
  const [selectedIcon, setSelectedIcon] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await getCategoryList();
      if (response.code === 200) {
        // 确保按ID从小到大排序（后端已排序，这里做双重保险）
        const sortedData = [...(response.data || [])].sort((a, b) => {
          const idA = a.id || 0;
          const idB = b.id || 0;
          return idA - idB;
        });
        setData(sortedData);
      }
    } catch (error) {
      message.error('获取分类列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingRecord(null);
    form.resetFields();
    setSelectedIcon(null);
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    form.setFieldsValue(record);
    setSelectedIcon(record.icon || null);
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await deleteCategory(id);
      message.success('删除成功');
      fetchData();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingRecord) {
        await updateCategory(editingRecord.id, values);
        message.success('更新成功');
      } else {
        await createCategory(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      fetchData();
    } catch (error) {
      if (error.errorFields) {
        return;
      }
      message.error(editingRecord ? '更新失败' : '创建失败');
    }
  };

  // 快速更新排序权重
  const handleSortOrderChange = async (id, newSortOrder) => {
    try {
      const record = data.find(item => item.id === id);
      if (!record) return;
      
      await updateCategory(id, {
        ...record,
        sortOrder: newSortOrder,
      });
      message.success('排序权重更新成功');
      fetchData();
    } catch (error) {
      message.error('更新失败');
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '图标',
      dataIndex: 'icon',
      key: 'icon',
      width: 100,
      align: 'center',
      render: (icon, record) => {
        // 调试信息（开发时可以取消注释）
        // console.log('渲染图标 - 记录ID:', record.id, '图标值:', icon, '类型:', typeof icon);
        
        // 如果有图标名称字符串，尝试动态获取图标组件
        if (icon && typeof icon === 'string' && icon.trim() !== '') {
          const iconName = icon.trim();
          
          // 直接从 Icons 对象中获取对应的图标组件
          let IconComponent = Icons[iconName];
          
          // 如果直接找不到，尝试添加 Outlined 后缀
          if (!IconComponent && !iconName.endsWith('Outlined') && !iconName.endsWith('Filled') && !iconName.endsWith('TwoTone')) {
            IconComponent = Icons[`${iconName}Outlined`];
          }
          
          // 如果找到了图标组件，使用 React.createElement 动态创建
          if (IconComponent) {
            try {
              return React.createElement(IconComponent, { 
                style: { fontSize: 24, color: '#1890ff' } 
              });
            } catch (error) {
              console.error('渲染图标失败:', iconName, error);
            }
          } else {
            // 调试：打印找不到的图标名称
            console.warn('未找到图标:', iconName, '可用图标示例:', Object.keys(Icons).slice(0, 5));
          }
        }
        
        // 如果没有图标或找不到对应图标，显示默认图标
        return <AppstoreOutlined style={{ fontSize: 24, color: '#d9d9d9' }} />;
      },
    },
    {
      title: '分类名称',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => {
        let IconElement = null;
        
        // 动态获取图标组件
        if (record.icon && typeof record.icon === 'string' && record.icon.trim() !== '') {
          const iconName = record.icon.trim();
          let IconComponent = Icons[iconName];
          
          // 如果找不到，尝试添加 Outlined 后缀
          if (!IconComponent && !iconName.endsWith('Outlined') && !iconName.endsWith('Filled') && !iconName.endsWith('TwoTone')) {
            IconComponent = Icons[`${iconName}Outlined`];
          }
          
          if (IconComponent && typeof IconComponent === 'function') {
            IconElement = React.createElement(IconComponent, { 
              style: { fontSize: 16, color: '#1890ff' } 
            });
          }
        }
        
        return (
          <Space>
            {IconElement}
            <span>{text}</span>
          </Space>
        );
      },
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '排序权重',
      dataIndex: 'sortOrder',
      key: 'sortOrder',
      width: 150,
      align: 'center',
      // 移除排序功能，保持按ID排序
      render: (sortOrder, record) => {
        return (
          <InputNumber
            min={0}
            max={9999}
            value={sortOrder ?? 0}
            style={{ width: '100%' }}
            size="small"
            onChange={(value) => {
              // 延迟更新，避免频繁请求
              if (value !== null && value !== undefined && value !== sortOrder) {
                // 使用防抖，延迟500ms后更新
                clearTimeout(record._sortOrderTimer);
                record._sortOrderTimer = setTimeout(() => {
                  handleSortOrderChange(record.id, value);
                }, 500);
              }
            }}
          />
        );
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 180,
      render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个分类吗？"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">影片分类管理</h2>
      </div>
      <div className="page-content">
        <div className="list-actions">
          <div></div>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            新增分类
          </Button>
        </div>
        <div className="table-container">
          <Table
            columns={columns}
            dataSource={data}
            rowKey="id"
            loading={loading}
            pagination={false}
            // 禁用Table的默认排序，保持按ID排序
            showSorterTooltip={false}
          />
        </div>
        <Modal
          title={editingRecord ? '编辑分类' : '新增分类'}
          open={modalVisible}
          onOk={handleSubmit}
          onCancel={() => setModalVisible(false)}
          okText="确定"
          cancelText="取消"
          okButtonProps={{ style: { borderRadius: '12px', fontWeight: 600 } }}
          cancelButtonProps={{ style: { borderRadius: '12px' } }}
        >
          <Form form={form} layout="vertical" style={{ marginTop: 8 }}>
            <Form.Item
              name="name"
              label="分类名称"
              rules={[{ required: true, message: '请输入分类名称!' }]}
            >
              <Input placeholder="请输入分类名称" />
            </Form.Item>
            <Form.Item
              name="description"
              label="描述"
            >
              <Input.TextArea rows={3} placeholder="请输入分类描述" />
            </Form.Item>
            <Form.Item
              name="icon"
              label="图标"
              extra={
                <div>
                  <div style={{ marginBottom: 4 }}>
                    选择Ant Design图标名称，例如：RocketOutlined、FireOutlined
                  </div>
                  {selectedIcon && (
                    <div style={{ marginTop: 8, padding: '8px 12px', background: '#f5f5f5', borderRadius: 4 }}>
                      <Space>
                        <span style={{ color: '#666' }}>当前预览：</span>
                        {(() => {
                          const IconComponent = getIconComponent(selectedIcon);
                          return IconComponent ? (
                            <>
                              <IconComponent style={{ fontSize: 18, color: '#1890ff' }} />
                              <span style={{ color: '#1890ff', fontWeight: 500 }}>{selectedIcon}</span>
                            </>
                          ) : (
                            <span style={{ color: '#999' }}>无效的图标名称</span>
                          );
                        })()}
                      </Space>
                    </div>
                  )}
                </div>
              }
            >
              <Select
                placeholder="请选择图标（可选，留空则不显示图标）"
                allowClear
                showSearch
                onChange={(value) => {
                  setSelectedIcon(value || null);
                }}
                filterOption={(input, option) => {
                  const label = option?.label ?? '';
                  return label.toLowerCase().includes(input.toLowerCase());
                }}
                notFoundContent="未找到匹配的图标"
                optionLabelProp="label"
              >
                {commonIcons.map(iconName => {
                  const IconComponent = getIconComponent(iconName);
                  return (
                    <Select.Option 
                      key={iconName} 
                      value={iconName} 
                      label={iconName}
                    >
                      <Space>
                        {IconComponent ? (
                          <IconComponent style={{ fontSize: 16 }} />
                        ) : (
                          <AppstoreOutlined style={{ fontSize: 16, color: '#d9d9d9' }} />
                        )}
                        <span>{iconName}</span>
                      </Space>
                    </Select.Option>
                  );
                })}
              </Select>
            </Form.Item>
            <Form.Item
              name="sortOrder"
              label="排序权重"
              extra="数字越小越靠前，默认为0"
              initialValue={0}
            >
              <InputNumber
                min={0}
                max={9999}
                placeholder="请输入排序权重"
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  );
};

export default CategoryList;








