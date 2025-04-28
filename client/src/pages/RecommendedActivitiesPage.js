import React from 'react';
import { Typography, Row, Col, Card } from 'antd';
import RecommendedActivities from '../components/RecommendedActivities';

const { Title, Paragraph } = Typography;

const RecommendedActivitiesPage = () => {
  return (
    <div>
      <Title level={2}>个性化学分活动推荐</Title>
      <Paragraph>
        根据您的学分情况，系统为您推荐以下活动，帮助您更好地完成学分要求。
      </Paragraph>
      
      <Row gutter={16}>
        <Col span={24}>
          <Card 
            title="学分活动说明" 
            style={{ marginBottom: 16 }}
          >
            <Paragraph>
              <strong>素拓学分：</strong>课外素质拓展活动所获得的学分，包括参加校园文化活动、社团活动、竞赛等。
            </Paragraph>
            <Paragraph>
              <strong>讲座学分：</strong>参加各类学术讲座、报告会等所获得的学分。
            </Paragraph>
            <Paragraph>
              <strong>劳动学分：</strong>参与志愿服务、公益劳动等活动所获得的学分。
            </Paragraph>
          </Card>
        </Col>
      </Row>
      
      <RecommendedActivities />
    </div>
  );
};

export default RecommendedActivitiesPage;
