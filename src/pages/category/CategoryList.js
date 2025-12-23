import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, message, Space, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { getCategoryList, createCategory, updateCategory, deleteCategory } from '../../utils/api';
import dayjs from 'dayjs';
import '../../styles/list-pages.css';

const CategoryList = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await getCategoryList();
      if (response.code === 200) {
        setData(response.data);
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
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    form.setFieldsValue(record);
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

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '分类名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
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
          </Form>
        </Modal>
      </div>
    </div>
  );
};

export default CategoryList;








